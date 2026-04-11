# Workout Editor Design Spec

## Overview

Add the ability to edit past workouts from the workout details screen. The editor opens the workout in a full PagerView — same components as a live workout session — with a red "Editing Workout" banner at the top. Users can modify workout metadata, edit/add/remove sets and exercises, reorder exercises, and delete the workout entirely.

## Entry Point

- Workout details screen (`app/(tabs)/stats/workout/[workoutId].tsx`) gets an edit pencil icon in the top-right header.
- Tapping it navigates to `app/(tabs)/stats/workout/edit/[workoutId].tsx`.

## Screen Structure

PagerView with a persistent red "Editing Workout" banner above it.

### Page 0: Workout Details

| Field | Input | Behavior |
|-------|-------|----------|
| Workout Name | Text input | Free text, optional |
| Gym Location | Text input / picker | Match existing gym selection pattern from WorkoutSummary |
| Start Time | DateTime picker | Independently editable. No other field affects it. |
| End Time | DateTime picker | Editable directly. When changed, duration recalculates. |
| Duration (min) | Numeric input | Helper field. When changed, sets endTime = startTime + duration. |

**Mutual update rules:**
- End time changes → duration = (endTime - startTime) / 60000
- Duration changes → endTime = startTime + duration * 60000
- Start time changes → end time stays fixed, duration recalculates

**Delete workout:** Red button at bottom. `Alert.alert` with destructive confirmation. On confirm, calls `DELETE /workouts/:workoutId`, invalidates queries, navigates to workout list.

### Pages 1..n-1: Exercise Slides

One `ExerciseSlide` per exercise, in order. Same components as the live workout. All actions available:

- Add set
- Duplicate last set
- Remove last set
- Update set (reps, weight)
- Toggle unilateral (bilateral ↔ L/R pairs)
- Change exercise profile
- Remove exercise (with `Alert.alert` confirmation)
- Reorder exercises (via `ReorderModal`)

### Page n: Add Exercise

`AddExerciseSlide` — search, suggested, favourites, alphabetical. Adds exercise to end of list; user can reorder after.

### Not supported (future)

- Swap exercise in-place — tracked in https://github.com/alexng353/uplifting/issues/4. Users can use add → configure → delete pattern for now.

## Hook Architecture

### `lib/workout-mutations.ts` — Pure mutation functions

Extract workout state mutations from `useWorkout` into pure functions:

```typescript
type WorkoutMutation<TArgs extends any[]> = (workout: StoredWorkout, ...args: TArgs) => StoredWorkout;

export const addSet: WorkoutMutation<[exerciseId: string, weightUnit: string, reps?: number, weight?: number, side?: string]>;
export const removeSet: WorkoutMutation<[exerciseId: string, setId: string]>;
export const updateSet: WorkoutMutation<[exerciseId: string, setId: string, updates: Partial<StoredSet>]>;
export const removeLastSet: WorkoutMutation<[exerciseId: string]>;
export const toggleUnilateral: WorkoutMutation<[exerciseId: string]>;
export const addExercise: WorkoutMutation<[exerciseId: string, exerciseName: string, profileId?: string, exerciseType?: string]>;
export const removeExercise: WorkoutMutation<[exerciseId: string]>;
export const reorderExercises: WorkoutMutation<[newOrder: string[]]>;
export const changeExerciseProfile: WorkoutMutation<[exerciseId: string, profileId?: string, exerciseName: string]>;
export const addUnilateralPair: WorkoutMutation<[exerciseId: string, weightUnit: string, reps?: number, weight?: number]>;
export const removeLastUnilateralPair: WorkoutMutation<[exerciseId: string]>;
```

Both `useWorkout` and `useEditWorkout` use these functions, keeping mutation logic DRY.

### `useEditWorkout` hook + `EditWorkoutProvider`

- Fetches workout from server via React Query
- Transforms server response into `StoredWorkout` shape
- Seeds `useState` with the transformed data
- Exposes the same action interface as `useWorkout` (addSet, removeSet, etc.), backed by pure mutation functions updating local state
- Provides `save()` — React Query mutation to PUT the full workout
- Provides `deleteWorkout()` — React Query mutation to DELETE
- Provides `hasChanges` — boolean, `true` when `JSON.stringify(currentState) !== JSON.stringify(initialState)` (deep equality via serialization, since the workout structure is simple and serializable)

### `useWorkoutActions()` — Unified hook

```typescript
interface WorkoutActions {
  workout: StoredWorkout | null;
  isActive: boolean;
  mode: "live" | "editing";
  addSet: (...) => void;
  removeSet: (...) => void;
  updateSet: (...) => void;
  // ... all shared actions
}
```

Checks for `EditWorkoutContext` first, falls back to `WorkoutContext`. All workout components (`ExerciseSlide`, `AddExerciseSlide`, `ReorderModal`) call this instead of `useWorkout` directly.

### Refactor `useWorkout`

Refactor existing `useWorkout` to use the pure mutation functions from `lib/workout-mutations.ts`. No behavior change — just delegates state updates to the shared helpers.

## Data Flow

### Loading

1. Navigate to edit screen with `workoutId` param
2. React Query fetches `GET /workouts/:workoutId`
3. Transform server response to `StoredWorkout`:
   - Map `exercise_id` → `exerciseId`, `profile_id` → `profileId`, etc.
   - Map sets with their `created_at` timestamps preserved
   - Detect `isUnilateral` from presence of `side` field on sets
4. Seed local state via `useState(transformedWorkout)`

### Editing

All mutations update local `useState` via pure functions. No server calls during editing. No interaction with MMKV storage or the live workout context.

### Saving

1. User taps "Save"
2. React Query `useMutation` calls `PUT /workouts/:workoutId` with full workout data (metadata + exercises + sets)
3. On success:
   - Invalidate query keys: `["workout", workoutId]`, `["workouts"]`, `["all-time-stats"]`, `["streak"]`
   - Navigate back to workout list
4. On failure: show error via mutation state, user can retry

### Discarding

- Back navigation checks `hasChanges`
- If changes exist: `Alert.alert` confirmation ("Discard changes?")
- If confirmed or no changes: navigate back, local state is garbage collected

### Deleting

1. User taps "Delete Workout" on page 0
2. `Alert.alert` with destructive confirmation
3. React Query mutation calls `DELETE /workouts/:workoutId`
4. On success: invalidate queries, navigate to workout list

## API Changes

### Extended PUT `/workouts/:workoutId`

Add optional `exercises` array to the existing endpoint. When present:

1. Update workout metadata (name, privacy, gym_location, start_time, end_time) — same as before
2. Delete all existing `user_sets` for this workout
3. Insert new sets from the payload
4. All within a single database transaction

```typescript
// Additional request body field
exercises?: {
  exercise_id: string;
  profile_id?: string;
  sets: {
    reps: number;
    weight: number;
    weight_unit: string;
    created_at?: string;  // preserved from original where possible
    side?: string;
    bodyweight?: number;
  }[];
}[]
```

When `exercises` is omitted, behavior is unchanged (metadata-only update). Backwards-compatible.

**Timestamp preservation:** The client sends back original `created_at` values on unmodified sets. New sets get `new Date().toISOString()`. The server trusts client-provided timestamps (same trust model as the existing sync endpoint).

**Response:** Returns the updated workout in the same shape as `GET /workouts/:workoutId` so the client can seed the React Query cache on success.

### Delete endpoint

Already exists at `DELETE /workouts/:workoutId`. No changes needed.

## Navigation Flow

```
Stats tab
  → Recent Workouts list
    → Workout Details [workoutId]
      → (edit pencil) Edit Workout [workoutId]
        → (save) back to Workout list
        → (delete) back to Workout list
        → (discard) back to Workout Details
```

## Files to Create/Modify

### New files
- `apps/mobile/lib/workout-mutations.ts` — pure mutation functions
- `apps/mobile/hooks/useEditWorkout.tsx` — edit state + context provider
- `apps/mobile/hooks/useWorkoutActions.ts` — unified action hook
- `apps/mobile/app/(tabs)/stats/workout/edit/[workoutId].tsx` — edit screen

### Modified files
- `apps/mobile/hooks/useWorkout.tsx` — refactor to use pure mutation functions
- `apps/mobile/components/workout/ExerciseSlide.tsx` — switch from `useWorkout()` to `useWorkoutActions()`
- `apps/mobile/components/workout/AddExerciseSlide.tsx` — switch to `useWorkoutActions()`
- `apps/mobile/components/workout/ReorderModal.tsx` — switch to `useWorkoutActions()`
- `apps/mobile/app/(tabs)/stats/workout/[workoutId].tsx` — add edit pencil icon
- `apps/mobile/app/(tabs)/workout.tsx` — switch to `useWorkoutActions()`
- `apps/api/src/routes/workouts.ts` — extend PUT endpoint with exercises support
