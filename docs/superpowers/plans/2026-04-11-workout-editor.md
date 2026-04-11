# Workout Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to edit past workouts from the workout
details screen, reusing the same exercise/set components as the
live workout session.

**Architecture:** Extract pure workout mutation functions from
`useWorkout` into a shared module. Build a dedicated
`EditWorkoutProvider` that uses these same mutations backed by
local `useState`. Create a unified `useWorkoutActions()` hook
that components call — it resolves to whichever context is
active (live or edit). Add a new edit screen using PagerView.
Extend the PUT API endpoint to accept exercises+sets.

**Tech Stack:** React Native, Expo Router, React Query,
PagerView, Elysia, Drizzle ORM, NativeWind

**Spec:**
`docs/superpowers/specs/2026-04-11-workout-editor-design.md`

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `apps/mobile/lib/workout-mutations.ts` | Pure functions: `(workout, args) => workout` for all set/exercise mutations |
| `apps/mobile/hooks/useEditWorkout.tsx` | `EditWorkoutProvider` + `useEditWorkout` hook — local state for editing, save/delete mutations |
| `apps/mobile/hooks/useWorkoutActions.ts` | Unified hook that resolves `EditWorkoutContext` or `WorkoutContext` |
| `apps/mobile/app/(tabs)/stats/workout/edit/[workoutId].tsx` | Edit screen with PagerView, red banner, save/discard/delete |

### Modified files

| File | Change |
|------|--------|
| `apps/mobile/hooks/useWorkout.tsx` | Delegate mutation logic to pure functions from `workout-mutations.ts` |
| `apps/mobile/components/workout/ExerciseSlide.tsx` | `useWorkout()` → `useWorkoutActions()` |
| `apps/mobile/components/workout/AddExerciseSlide.tsx` | `useWorkout()` → `useWorkoutActions()` |
| `apps/mobile/components/workout/ReorderModal.tsx` | `useWorkout()` → `useWorkoutActions()` |
| ~~`apps/mobile/app/(tabs)/workout.tsx`~~ | Not needed — uses lifecycle actions (start/finish/cancel) not in `WorkoutActions` |
| `apps/mobile/app/(tabs)/stats/workout/[workoutId].tsx` | Add edit pencil icon in header |
| `apps/api/src/routes/workouts.ts` | Extend PUT endpoint with optional `exercises` array |

---

## Task 1: Extract pure workout mutation functions

**Files:**
- Create: `apps/mobile/lib/workout-mutations.ts`

- [ ] **Step 1: Create the pure mutations module**

Create `apps/mobile/lib/workout-mutations.ts` with all mutation
functions extracted from `useWorkout`. Each function takes a
`StoredWorkout` and returns a new `StoredWorkout`. Import
`generateId` from `../services/storage` for ID generation.

```typescript
import {
  generateId,
  getSettings,
  type StoredSet,
  type StoredWorkout,
  type StoredWorkoutExercise,
} from "../services/storage";

export function addExerciseMutation(
  workout: StoredWorkout,
  exerciseId: string,
  exerciseName: string,
  profileId?: string,
  exerciseType?: string,
): StoredWorkout {
  const settings = getSettings();
  const unit = settings.displayUnit ?? "kg";

  const firstSet: StoredSet = {
    id: generateId(),
    weightUnit: unit,
    createdAt: new Date().toISOString(),
    bodyweight:
      exerciseType === "Bodyweight"
        ? (settings.bodyweight ?? undefined)
        : undefined,
  };

  const newExercise: StoredWorkoutExercise = {
    exerciseId,
    exerciseName,
    exerciseType,
    profileId,
    sets: [firstSet],
  };

  return {
    ...workout,
    exercises: [...workout.exercises, newExercise],
  };
}

export function removeExerciseMutation(
  workout: StoredWorkout,
  exerciseId: string,
): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.filter(
      (e) => e.exerciseId !== exerciseId,
    ),
  };
}

export function reorderExercisesMutation(
  workout: StoredWorkout,
  newOrder: string[],
): StoredWorkout {
  const exerciseMap = new Map(
    workout.exercises.map((e) => [e.exerciseId, e]),
  );
  const reordered = newOrder
    .map((id) => exerciseMap.get(id))
    .filter(
      (e): e is StoredWorkoutExercise => e !== undefined,
    );

  return { ...workout, exercises: reordered };
}

function getBodyweightForExercise(
  workout: StoredWorkout,
  exerciseId: string,
): number | undefined {
  const exercise = workout.exercises.find(
    (e) => e.exerciseId === exerciseId,
  );
  if (exercise?.exerciseType !== "Bodyweight") return undefined;
  const settings = getSettings();
  return settings.bodyweight ?? undefined;
}

export function addSetMutation(
  workout: StoredWorkout,
  exerciseId: string,
  weightUnit: string,
  reps?: number,
  weight?: number,
  side?: "L" | "R",
): StoredWorkout {
  const bodyweight = getBodyweightForExercise(
    workout,
    exerciseId,
  );
  const newSet: StoredSet = {
    id: generateId(),
    reps,
    weight,
    weightUnit,
    createdAt: new Date().toISOString(),
    side,
    bodyweight,
  };

  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId
        ? { ...e, sets: [...e.sets, newSet] }
        : e,
    ),
  };
}

export function addUnilateralPairMutation(
  workout: StoredWorkout,
  exerciseId: string,
  weightUnit: string,
  reps?: number,
  weight?: number,
): StoredWorkout {
  const bodyweight = getBodyweightForExercise(
    workout,
    exerciseId,
  );
  const rightSet: StoredSet = {
    id: generateId(),
    reps,
    weight,
    weightUnit,
    createdAt: new Date().toISOString(),
    side: "R",
    bodyweight,
  };

  const leftSet: StoredSet = {
    id: generateId(),
    reps,
    weight,
    weightUnit,
    createdAt: new Date().toISOString(),
    side: "L",
    bodyweight,
  };

  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId
        ? { ...e, sets: [...e.sets, rightSet, leftSet] }
        : e,
    ),
  };
}

export function updateSetMutation(
  workout: StoredWorkout,
  exerciseId: string,
  setId: string,
  updates: Partial<StoredSet>,
): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId
        ? {
            ...e,
            sets: e.sets.map((s) =>
              s.id === setId ? { ...s, ...updates } : s,
            ),
          }
        : e,
    ),
  };
}

export function removeSetMutation(
  workout: StoredWorkout,
  exerciseId: string,
  setId: string,
): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId
        ? {
            ...e,
            sets: e.sets.filter((s) => s.id !== setId),
          }
        : e,
    ),
  };
}

export function removeLastSetMutation(
  workout: StoredWorkout,
  exerciseId: string,
): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId
        ? { ...e, sets: e.sets.slice(0, -1) }
        : e,
    ),
  };
}

export function removeLastUnilateralPairMutation(
  workout: StoredWorkout,
  exerciseId: string,
): StoredWorkout {
  const exercise = workout.exercises.find(
    (e) => e.exerciseId === exerciseId,
  );
  if (!exercise) return workout;

  const rightSets = exercise.sets.filter(
    (s) => s.side === "R",
  );
  const leftSets = exercise.sets.filter(
    (s) => s.side === "L",
  );
  const lastRight = rightSets[rightSets.length - 1];
  const lastLeft = leftSets[leftSets.length - 1];

  const idsToRemove = new Set<string>();
  if (lastRight) idsToRemove.add(lastRight.id);
  if (lastLeft) idsToRemove.add(lastLeft.id);

  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId
        ? {
            ...e,
            sets: e.sets.filter(
              (s) => !idsToRemove.has(s.id),
            ),
          }
        : e,
    ),
  };
}

export function toggleUnilateralMutation(
  workout: StoredWorkout,
  exerciseId: string,
): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;

      const isCurrentlyUnilateral = e.isUnilateral ?? false;

      if (!isCurrentlyUnilateral) {
        // Expand bilateral sets into L/R pairs
        const expandedSets = e.sets.flatMap((set) => {
          if (set.side) return [set];
          const rightSet: StoredSet = {
            ...set,
            side: "R",
          };
          const leftSet: StoredSet = {
            ...set,
            id: generateId(),
            side: "L",
          };
          return [rightSet, leftSet];
        });
        return {
          ...e,
          isUnilateral: true,
          sets: expandedSets,
        };
      }

      // Merge L/R pairs into bilateral sets
      const rightSets = e.sets.filter(
        (set) => set.side === "R" || !set.side,
      );
      const leftSets = e.sets.filter(
        (set) => set.side === "L",
      );
      const maxLen = Math.max(
        rightSets.length,
        leftSets.length,
      );
      const mergedSets: StoredSet[] = [];

      for (let i = 0; i < maxLen; i += 1) {
        const rightSet = rightSets[i];
        const leftSet = leftSets[i];
        if (!rightSet && !leftSet) continue;
        const baseSet = rightSet ?? leftSet;
        if (!baseSet) continue;

        mergedSets.push({
          id: rightSet?.id ?? leftSet?.id ?? generateId(),
          reps: rightSet?.reps ?? leftSet?.reps,
          weight: rightSet?.weight ?? leftSet?.weight,
          weightUnit:
            rightSet?.weightUnit ??
            leftSet?.weightUnit ??
            baseSet.weightUnit,
          createdAt:
            rightSet?.createdAt ??
            leftSet?.createdAt ??
            baseSet.createdAt,
        });
      }

      return {
        ...e,
        isUnilateral: false,
        sets: mergedSets,
      };
    }),
  };
}

export function changeExerciseProfileMutation(
  workout: StoredWorkout,
  exerciseId: string,
  profileId: string | undefined,
  exerciseName: string,
): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId
        ? { ...e, profileId, exerciseName }
        : e,
    ),
  };
}
```

- [ ] **Step 2: Verify the module compiles**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: no errors from `lib/workout-mutations.ts`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/workout-mutations.ts
git commit -m "[agent] feat: extract pure workout mutation functions

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

---

## Task 2: Refactor useWorkout to use pure mutations

**Files:**
- Modify: `apps/mobile/hooks/useWorkout.tsx`

- [ ] **Step 1: Import and delegate to pure mutations**

In `apps/mobile/hooks/useWorkout.tsx`, add the import at the
top:

```typescript
import {
  addExerciseMutation,
  addSetMutation,
  addUnilateralPairMutation,
  changeExerciseProfileMutation,
  removeExerciseMutation,
  removeLastSetMutation,
  removeLastUnilateralPairMutation,
  removeSetMutation,
  reorderExercisesMutation,
  toggleUnilateralMutation,
  updateSetMutation,
} from "../lib/workout-mutations";
```

Then replace each mutation callback body to delegate. For
example, `addExercise` becomes:

```typescript
const addExercise = useCallback(
  (
    exerciseId: string,
    exerciseName: string,
    profileId?: string,
    exerciseType?: string,
  ) => {
    if (!workout) return;
    saveWorkout(
      addExerciseMutation(
        workout,
        exerciseId,
        exerciseName,
        profileId,
        exerciseType,
      ),
    );
  },
  [workout, saveWorkout],
);
```

Apply the same pattern to every mutation:

- `removeExercise` → `removeExerciseMutation(workout, exerciseId)`
- `reorderExercises` → `reorderExercisesMutation(workout, newOrder)`
- `addSet` → `addSetMutation(workout, exerciseId, weightUnit, reps, weight, side)`
- `addUnilateralPair` → `addUnilateralPairMutation(workout, exerciseId, weightUnit, reps, weight)`
- `updateSet` → `updateSetMutation(workout, exerciseId, setId, updates)`
- `removeSet` → `removeSetMutation(workout, exerciseId, setId)`
- `removeLastSet` → `removeLastSetMutation(workout, exerciseId)`
- `removeLastUnilateralPair` → `removeLastUnilateralPairMutation(workout, exerciseId)`
- `toggleUnilateral` → `toggleUnilateralMutation(workout, exerciseId)`
- `changeExerciseProfile` → `changeExerciseProfileMutation(workout, exerciseId, profileId, exerciseName)`

Remove the `getBodyweightForExercise` helper since it's now
internal to the mutations module. Remove all the inline
mutation logic that was replaced.

- [ ] **Step 2: Verify compilation**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hooks/useWorkout.tsx
git commit -m "[agent] refactor: delegate useWorkout mutations to pure functions

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

---

## Task 3: Create useWorkoutActions unified hook

**Files:**
- Create: `apps/mobile/hooks/useWorkoutActions.ts`

- [ ] **Step 1: Create the unified hook**

This hook checks for `EditWorkoutContext` first, falls back to
`WorkoutContext`. It exposes only the shared action interface
that components need. The `EditWorkoutContext` will be created
in Task 5 — for now, import the context value type and set up
the fallback.

```typescript
import { createContext, useContext } from "react";
import type {
  StoredSet,
  StoredWorkout,
} from "../services/storage";
import { useWorkout } from "./useWorkout";

export interface WorkoutActions {
  workout: StoredWorkout | null;
  isActive: boolean;
  mode: "live" | "editing";
  addExercise: (
    exerciseId: string,
    exerciseName: string,
    profileId?: string,
    exerciseType?: string,
  ) => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (newOrder: string[]) => void;
  addSet: (
    exerciseId: string,
    weightUnit: string,
    reps?: number,
    weight?: number,
    side?: "L" | "R",
  ) => void;
  addUnilateralPair: (
    exerciseId: string,
    weightUnit: string,
    reps?: number,
    weight?: number,
  ) => void;
  updateSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<StoredSet>,
  ) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  removeLastSet: (exerciseId: string) => void;
  removeLastUnilateralPair: (exerciseId: string) => void;
  toggleUnilateral: (exerciseId: string) => void;
  changeExerciseProfile: (
    exerciseId: string,
    profileId: string | undefined,
    exerciseName: string,
  ) => void;
}

// EditWorkoutContext is provided by EditWorkoutProvider
// (Task 5). Defined here to avoid circular imports.
export const EditWorkoutContext =
  createContext<WorkoutActions | null>(null);

// Meta context for edit-specific state (save, delete, etc.)
export interface EditWorkoutMeta {
  workout: StoredWorkout | null;
  setWorkout: (w: StoredWorkout) => void;
  hasChanges: boolean;
  save: () => Promise<unknown>;
  isSaving: boolean;
  saveError: string | null;
  deleteWorkout: () => Promise<unknown>;
  isDeleting: boolean;
  deleteError: string | null;
  actions: WorkoutActions | null;
}

export const EditWorkoutMetaContext =
  createContext<EditWorkoutMeta | null>(null);

export function useEditWorkoutMeta(): EditWorkoutMeta {
  const context = useContext(EditWorkoutMetaContext);
  if (!context) {
    throw new Error(
      "useEditWorkoutMeta must be used within EditWorkoutProvider",
    );
  }
  return context;
}

export function useWorkoutActions(): WorkoutActions {
  const editContext = useContext(EditWorkoutContext);
  // Always call useWorkout() unconditionally to satisfy
  // React's rules of hooks. WorkoutProvider wraps the
  // entire app, so this always succeeds.
  const liveWorkout = useWorkout();

  if (editContext) return editContext;

  return {
    workout: liveWorkout.workout,
    isActive: liveWorkout.isActive,
    mode: "live",
    addExercise: liveWorkout.addExercise,
    removeExercise: liveWorkout.removeExercise,
    reorderExercises: liveWorkout.reorderExercises,
    addSet: liveWorkout.addSet,
    addUnilateralPair: liveWorkout.addUnilateralPair,
    updateSet: liveWorkout.updateSet,
    removeSet: liveWorkout.removeSet,
    removeLastSet: liveWorkout.removeLastSet,
    removeLastUnilateralPair:
      liveWorkout.removeLastUnilateralPair,
    toggleUnilateral: liveWorkout.toggleUnilateral,
    changeExerciseProfile: liveWorkout.changeExerciseProfile,
  };
}

- [ ] **Step 2: Verify compilation**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hooks/useWorkoutActions.ts
git commit -m "[agent] feat: add useWorkoutActions unified hook

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

---

## Task 4: Switch components to useWorkoutActions

**Files:**
- Modify: `apps/mobile/components/workout/ExerciseSlide.tsx`
- Modify: `apps/mobile/components/workout/AddExerciseSlide.tsx`
- Modify: `apps/mobile/components/workout/ReorderModal.tsx`

- [ ] **Step 1: Update ExerciseSlide**

In `apps/mobile/components/workout/ExerciseSlide.tsx`:

Change the import from:
```typescript
import { useWorkout } from "../../hooks/useWorkout";
```
to:
```typescript
import { useWorkoutActions } from "../../hooks/useWorkoutActions";
```

Change the destructuring at line 120-128 from:
```typescript
const {
  addSet,
  addUnilateralPair,
  updateSet,
  toggleUnilateral,
  removeLastSet,
  removeLastUnilateralPair,
  changeExerciseProfile,
} = useWorkout();
```
to:
```typescript
const {
  addSet,
  addUnilateralPair,
  updateSet,
  toggleUnilateral,
  removeLastSet,
  removeLastUnilateralPair,
  changeExerciseProfile,
} = useWorkoutActions();
```

- [ ] **Step 2: Update AddExerciseSlide**

In `apps/mobile/components/workout/AddExerciseSlide.tsx`:

Change the import from:
```typescript
import { useWorkout } from "../../hooks/useWorkout";
```
to:
```typescript
import { useWorkoutActions } from "../../hooks/useWorkoutActions";
```

Change line 29 from:
```typescript
const { addExercise } = useWorkout();
```
to:
```typescript
const { addExercise } = useWorkoutActions();
```

- [ ] **Step 3: Update ReorderModal**

In `apps/mobile/components/workout/ReorderModal.tsx`:

Change the import from:
```typescript
import { useWorkout } from "../../hooks/useWorkout";
```
to:
```typescript
import { useWorkoutActions } from "../../hooks/useWorkoutActions";
```

Change line 13 from:
```typescript
const { workout, reorderExercises } = useWorkout();
```
to:
```typescript
const { workout, reorderExercises } = useWorkoutActions();
```

- [ ] **Step 4: Verify compilation**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/components/workout/ExerciseSlide.tsx \
       apps/mobile/components/workout/AddExerciseSlide.tsx \
       apps/mobile/components/workout/ReorderModal.tsx
git commit -m "[agent] refactor: switch workout components to useWorkoutActions

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

---

## Task 5: Create useEditWorkout hook and EditWorkoutProvider

**Files:**
- Create: `apps/mobile/hooks/useEditWorkout.tsx`

- [ ] **Step 1: Create the hook**

This hook fetches the workout from the server, transforms it
into `StoredWorkout` shape, and provides mutation actions backed
by local state. It also provides save and delete mutations via
React Query.

```typescript
import {
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import {
  generateId,
  type StoredSet,
  type StoredWorkout,
  type StoredWorkoutExercise,
} from "../services/storage";
import {
  type WorkoutActions,
  EditWorkoutContext,
  EditWorkoutMetaContext,
} from "./useWorkoutActions";
import {
  addExerciseMutation,
  addSetMutation,
  addUnilateralPairMutation,
  changeExerciseProfileMutation,
  removeExerciseMutation,
  removeLastSetMutation,
  removeLastUnilateralPairMutation,
  removeSetMutation,
  reorderExercisesMutation,
  toggleUnilateralMutation,
  updateSetMutation,
} from "../lib/workout-mutations";

// Fetch exercise names for the transform
function useExerciseNames() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      return unwrap(
        await api.api.v1.exercises.get({
          query: { limit: "500" },
        }),
      );
    },
  });
}

// Fetch exercise profiles for display names
function useAllProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      return unwrap(await api.api.v1.exercises.profiles.get());
    },
  });
}

/**
 * Transform server workout response into StoredWorkout shape.
 * The server groups sets by (exercise_id, profile_id) and
 * returns them under `exercises`.
 */
function transformToStoredWorkout(
  serverWorkout: any,
  exerciseMap: Map<string, any>,
  profileMap: Map<string, any>,
): StoredWorkout {
  const exercises: StoredWorkoutExercise[] = (
    serverWorkout.exercises ?? []
  ).map((group: any) => {
    const exercise = exerciseMap.get(group.exercise_id);
    const profile = group.profile_id
      ? profileMap.get(group.profile_id)
      : null;

    const baseName = exercise?.name ?? "Unknown Exercise";
    const displayName = profile
      ? `${baseName} (${profile.name})`
      : baseName;

    return {
      exerciseId: group.exercise_id,
      profileId: group.profile_id ?? undefined,
      exerciseName: displayName,
      exerciseType: exercise?.exercise_type,
      isUnilateral: group.is_unilateral,
      sets: group.sets.map((s: any) => ({
        id: s.id ?? generateId(),
        reps: s.reps,
        weight: Number(s.weight),
        weightUnit: s.weightUnit ?? s.weight_unit ?? "kg",
        createdAt:
          s.createdAt ??
          s.created_at ??
          new Date().toISOString(),
        side: s.side as "L" | "R" | undefined,
        bodyweight: s.bodyweight
          ? Number(s.bodyweight)
          : undefined,
      })),
    };
  });

  return {
    id: serverWorkout.id,
    startTime:
      typeof serverWorkout.startTime === "string"
        ? serverWorkout.startTime
        : new Date(serverWorkout.startTime).toISOString(),
    endTime: serverWorkout.endTime
      ? typeof serverWorkout.endTime === "string"
        ? serverWorkout.endTime
        : new Date(serverWorkout.endTime).toISOString()
      : undefined,
    exercises,
    name: serverWorkout.name ?? undefined,
    privacy: serverWorkout.privacy ?? "friends",
    gymLocation: serverWorkout.gymLocation ?? undefined,
    kind: serverWorkout.kind ?? "workout",
  };
}

interface EditWorkoutState {
  workout: StoredWorkout;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  hasChanges: boolean;
  isSaving: boolean;
  saveError: string | null;
  isDeleting: boolean;
  deleteError: string | null;
}

export function useEditWorkoutState(workoutId: string) {
  const queryClient = useQueryClient();
  const [workout, setWorkout] = useState<StoredWorkout | null>(
    null,
  );
  const initialRef = useRef<string | null>(null);

  // Fetch workout data
  const { isLoading, error: fetchError } = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: async () => {
      return unwrap(
        await api.api.v1.workouts({ workoutId }).get(),
      );
    },
    enabled: !!workoutId,
  });

  // Fetch exercises + profiles for the transform
  const { data: exerciseList } = useExerciseNames();
  const { data: profileList } = useAllProfiles();

  const exerciseMap = useMemo(
    () =>
      new Map((exerciseList ?? []).map((e: any) => [e.id, e])),
    [exerciseList],
  );

  const profileMap = useMemo(
    () =>
      new Map((profileList ?? []).map((p: any) => [p.id, p])),
    [profileList],
  );

  // Get the cached workout data from React Query
  const cachedWorkout = queryClient.getQueryData([
    "workout",
    workoutId,
  ]) as any;

  // Seed local state once we have all data
  if (
    cachedWorkout &&
    exerciseList &&
    profileList &&
    workout === null
  ) {
    const transformed = transformToStoredWorkout(
      cachedWorkout,
      exerciseMap,
      profileMap,
    );
    setWorkout(transformed);
    initialRef.current = JSON.stringify(transformed);
  }

  const hasChanges =
    workout !== null &&
    initialRef.current !== null &&
    JSON.stringify(workout) !== initialRef.current;

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (w: StoredWorkout) => {
      return unwrap(
        await api.api.v1
          .workouts({ workoutId })
          .put({
            name: w.name,
            start_time: w.startTime,
            end_time: w.endTime,
            privacy: w.privacy,
            gym_location: w.gymLocation,
            exercises: w.exercises.map((e) => ({
              exercise_id: e.exerciseId,
              profile_id: e.profileId,
              sets: e.sets
                .filter(
                  (s) => s.reps != null && s.reps > 0,
                )
                .map((s) => ({
                  reps: s.reps ?? 1,
                  weight: s.weight ?? 0,
                  weight_unit: s.weightUnit,
                  created_at: s.createdAt,
                  side: s.side,
                  bodyweight: s.bodyweight,
                })),
            })),
          }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workout", workoutId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workouts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-time-stats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["streak"],
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return unwrap(
        await api.api.v1
          .workouts({ workoutId })
          .delete(),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workouts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-time-stats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["streak"],
      });
    },
  });

  // Mutation wrappers
  const apply = useCallback(
    (fn: (w: StoredWorkout) => StoredWorkout) => {
      setWorkout((prev) => (prev ? fn(prev) : prev));
    },
    [],
  );

  const actions: WorkoutActions | null = workout
    ? {
        workout,
        isActive: true,
        mode: "editing",
        addExercise: (
          exerciseId,
          exerciseName,
          profileId?,
          exerciseType?,
        ) =>
          apply((w) =>
            addExerciseMutation(
              w,
              exerciseId,
              exerciseName,
              profileId,
              exerciseType,
            ),
          ),
        removeExercise: (exerciseId) =>
          apply((w) =>
            removeExerciseMutation(w, exerciseId),
          ),
        reorderExercises: (newOrder) =>
          apply((w) =>
            reorderExercisesMutation(w, newOrder),
          ),
        addSet: (exerciseId, weightUnit, reps?, weight?, side?) =>
          apply((w) =>
            addSetMutation(
              w,
              exerciseId,
              weightUnit,
              reps,
              weight,
              side,
            ),
          ),
        addUnilateralPair: (
          exerciseId,
          weightUnit,
          reps?,
          weight?,
        ) =>
          apply((w) =>
            addUnilateralPairMutation(
              w,
              exerciseId,
              weightUnit,
              reps,
              weight,
            ),
          ),
        updateSet: (exerciseId, setId, updates) =>
          apply((w) =>
            updateSetMutation(
              w,
              exerciseId,
              setId,
              updates,
            ),
          ),
        removeSet: (exerciseId, setId) =>
          apply((w) =>
            removeSetMutation(w, exerciseId, setId),
          ),
        removeLastSet: (exerciseId) =>
          apply((w) =>
            removeLastSetMutation(w, exerciseId),
          ),
        removeLastUnilateralPair: (exerciseId) =>
          apply((w) =>
            removeLastUnilateralPairMutation(
              w,
              exerciseId,
            ),
          ),
        toggleUnilateral: (exerciseId) =>
          apply((w) =>
            toggleUnilateralMutation(w, exerciseId),
          ),
        changeExerciseProfile: (
          exerciseId,
          profileId,
          exerciseName,
        ) =>
          apply((w) =>
            changeExerciseProfileMutation(
              w,
              exerciseId,
              profileId,
              exerciseName,
            ),
          ),
      }
    : null;

  return {
    workout,
    setWorkout,
    actions,
    isReady: workout !== null,
    isLoading,
    fetchError: fetchError?.message ?? null,
    hasChanges,
    save: () => workout && saveMutation.mutateAsync(workout),
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error?.message ?? null,
    deleteWorkout: () => deleteMutation.mutateAsync(),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
}

// Provider component — provides both action context
// (for shared components) and meta context (for the
// edit screen's save/delete/discard UI)
export function EditWorkoutProvider({
  workoutId,
  children,
}: {
  workoutId: string;
  children: ReactNode;
}) {
  const state = useEditWorkoutState(workoutId);

  if (!state.actions) return null;

  const meta = {
    workout: state.workout,
    setWorkout: state.setWorkout,
    hasChanges: state.hasChanges,
    save: state.save,
    isSaving: state.isSaving,
    saveError: state.saveError,
    deleteWorkout: state.deleteWorkout,
    isDeleting: state.isDeleting,
    deleteError: state.deleteError,
    actions: state.actions,
  };

  return (
    <EditWorkoutMetaContext.Provider value={meta}>
      <EditWorkoutContext.Provider value={state.actions}>
        {children}
      </EditWorkoutContext.Provider>
    </EditWorkoutMetaContext.Provider>
  );
}
```

**Note:** The `exercises` field in the PUT body won't exist on
the API types yet (Task 7 adds it). This will cause a type
error until then — that's expected. We'll verify full
compilation after Task 7.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hooks/useEditWorkout.tsx
git commit -m "[agent] feat: add useEditWorkout hook and EditWorkoutProvider

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

---

## Task 6: Add edit pencil to workout details screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/stats/workout/[workoutId].tsx`

- [ ] **Step 1: Add the edit button to the header**

In the header `View` (around line 188-195), add an edit pencil
icon that navigates to the edit screen. Change the header from:

```tsx
<View className="flex-row items-center px-4 pt-4 pb-2">
  <Pressable onPress={() => router.back()} className="mr-3 p-1">
    <Ionicons name="chevron-back" size={24} color="#3b82f6" />
  </Pressable>
  <Text className="flex-1 text-xl font-bold dark:text-zinc-100" numberOfLines={1}>
    {workout.name || "Workout"}
  </Text>
</View>
```

to:

```tsx
<View className="flex-row items-center px-4 pt-4 pb-2">
  <Pressable onPress={() => router.back()} className="mr-3 p-1">
    <Ionicons name="chevron-back" size={24} color="#3b82f6" />
  </Pressable>
  <Text className="flex-1 text-xl font-bold dark:text-zinc-100" numberOfLines={1}>
    {workout.name || "Workout"}
  </Text>
  <Pressable
    onPress={() => router.push(`/stats/workout/edit/${workoutId}`)}
    className="ml-2 p-1"
  >
    <Ionicons name="pencil" size={20} color="#3b82f6" />
  </Pressable>
</View>
```

- [ ] **Step 2: Verify compilation**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(tabs)/stats/workout/[workoutId].tsx
git commit -m "[agent] feat: add edit pencil to workout details screen

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

---

## Task 7: Extend PUT API endpoint with exercises support

**Files:**
- Modify: `apps/api/src/routes/workouts.ts`

- [ ] **Step 1: Update the PUT endpoint**

In `apps/api/src/routes/workouts.ts`, modify the PUT
`/:workoutId` endpoint (lines 324-372).

Update the body schema to include the optional `exercises`
array:

```typescript
{
  body: t.Object({
    name: t.Optional(t.String()),
    privacy: t.Optional(t.String()),
    gym_location: t.Optional(t.String()),
    start_time: t.Optional(t.String()),
    end_time: t.Optional(t.String()),
    exercises: t.Optional(
      t.Array(
        t.Object({
          exercise_id: t.String(),
          profile_id: t.Optional(t.String()),
          sets: t.Array(
            t.Object({
              reps: t.Number(),
              weight: t.Number(),
              weight_unit: t.String(),
              created_at: t.Optional(t.String()),
              side: t.Optional(t.String()),
              bodyweight: t.Optional(t.Number()),
            }),
          ),
        }),
      ),
    ),
  }),
}
```

Update the handler to process exercises within a transaction
when provided. Replace the handler body (after the ownership
check) with:

```typescript
// If exercises provided, do full update in transaction
if (body.exercises) {
  const result = await db.transaction(async (tx) => {
    // 1. Update workout metadata
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.privacy !== undefined)
      updates.privacy = body.privacy;
    if (body.gym_location !== undefined)
      updates.gymLocation = body.gym_location;
    if (body.start_time !== undefined)
      updates.startTime = new Date(body.start_time);
    if (body.end_time !== undefined)
      updates.endTime = new Date(body.end_time);

    let updated;
    if (Object.keys(updates).length > 0) {
      [updated] = await tx
        .update(workouts)
        .set(updates)
        .where(eq(workouts.id, params.workoutId))
        .returning();
    } else {
      [updated] = await tx
        .select()
        .from(workouts)
        .where(eq(workouts.id, params.workoutId))
        .limit(1);
    }

    // 2. Delete all existing sets for this workout
    await tx
      .delete(userSets)
      .where(eq(userSets.workoutId, params.workoutId));

    // 3. Insert new sets
    for (const exercise of body.exercises!) {
      for (const s of exercise.sets) {
        await tx.insert(userSets).values({
          userId,
          workoutId: params.workoutId,
          exerciseId: exercise.exercise_id,
          profileId: exercise.profile_id,
          reps: s.reps,
          weight: String(s.weight),
          weightUnit: s.weight_unit,
          side: s.side,
          bodyweight: s.bodyweight
            ? String(s.bodyweight)
            : undefined,
          createdAt: s.created_at
            ? new Date(s.created_at)
            : new Date(),
        });
      }
    }

    return updated;
  });

  // Return with grouped exercises (same shape as GET)
  const sets = await db
    .select()
    .from(userSets)
    .where(eq(userSets.workoutId, params.workoutId))
    .orderBy(asc(userSets.createdAt));

  const groupMap = new Map<
    string,
    {
      exercise_id: string;
      profile_id: string | null;
      is_unilateral: boolean;
      sets: (typeof sets)[number][];
    }
  >();

  for (const s of sets) {
    const key = `${s.exerciseId}|${s.profileId ?? "null"}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        exercise_id: s.exerciseId,
        profile_id: s.profileId,
        is_unilateral: false,
        sets: [],
      });
    }
    const group = groupMap.get(key)!;
    if (s.side !== null) group.is_unilateral = true;
    group.sets.push(s);
  }

  return {
    ...result,
    exercises: Array.from(groupMap.values()),
  };
}

// Metadata-only update (original behavior)
const updates: Record<string, unknown> = {};
if (body.name !== undefined) updates.name = body.name;
if (body.privacy !== undefined)
  updates.privacy = body.privacy;
if (body.gym_location !== undefined)
  updates.gymLocation = body.gym_location;
if (body.start_time !== undefined)
  updates.startTime = new Date(body.start_time);
if (body.end_time !== undefined)
  updates.endTime = new Date(body.end_time);

const [updated] = await db
  .update(workouts)
  .set(updates)
  .where(eq(workouts.id, params.workoutId))
  .returning();

return updated;
```

- [ ] **Step 2: Verify the API compiles**

Run: `cd apps/api && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/workouts.ts
git commit -m "[agent] feat: extend PUT /workouts/:workoutId with exercises support

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

---

## Task 8: Build the edit workout screen

**Files:**
- Create: `apps/mobile/app/(tabs)/stats/workout/edit/[workoutId].tsx`

- [ ] **Step 1: Create the edit screen**

This is the main edit screen with PagerView. It wraps content
in `EditWorkoutProvider` and uses the same `ExerciseSlide` and
`AddExerciseSlide` components. Page 0 is a workout details form.

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import PagerView from "react-native-pager-view";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { useThemeColors } from "../../../../../hooks/useThemeColors";
import { EditWorkoutProvider } from "../../../../../hooks/useEditWorkout";
import {
  useWorkoutActions,
  useEditWorkoutMeta,
} from "../../../../../hooks/useWorkoutActions";
import ExerciseSlide from "../../../../../components/workout/ExerciseSlide";
import AddExerciseSlide from "../../../../../components/workout/AddExerciseSlide";
import ReorderModal from "../../../../../components/workout/ReorderModal";

function WorkoutDetailsPage({
  onDelete,
}: {
  onDelete: () => void;
}) {
  const { workout } = useWorkoutActions();
  const colors = useThemeColors();
  const meta = useEditWorkoutMeta();

  // Local form state derived from workout
  const [name, setName] = useState(workout?.name ?? "");
  const [gymLocation, setGymLocation] = useState(
    workout?.gymLocation ?? "",
  );
  const [startTime, setStartTime] = useState(
    workout?.startTime
      ? new Date(workout.startTime)
      : new Date(),
  );
  const [endTime, setEndTime] = useState(
    workout?.endTime
      ? new Date(workout.endTime)
      : new Date(),
  );

  // Sync form changes back to workout state
  useEffect(() => {
    if (!workout) return;
    meta.setWorkout({
      ...workout,
      name: name || undefined,
      gymLocation: gymLocation || undefined,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  }, [name, gymLocation, startTime, endTime]);

  const duration = Math.max(
    0,
    Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000,
    ),
  );

  const handleDurationChange = useCallback(
    (text: string) => {
      const mins = parseInt(text, 10);
      if (!isNaN(mins) && mins >= 0) {
        setEndTime(
          new Date(startTime.getTime() + mins * 60000),
        );
      }
    },
    [startTime],
  );

  const handleStartTimeChange = useCallback(
    (_: any, date?: Date) => {
      if (date) {
        setStartTime(date);
        // End time stays fixed, duration recalculates
      }
    },
    [],
  );

  const handleEndTimeChange = useCallback(
    (_: any, date?: Date) => {
      if (date) setEndTime(date);
    },
    [],
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to permanently delete this workout? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ],
    );
  }, [onDelete]);

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-900 px-4"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mt-4 mb-4 text-xl font-bold dark:text-zinc-100">
        Workout Details
      </Text>

      {/* Name */}
      <Text className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Workout Name
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Push Day"
        placeholderTextColor={colors.placeholder}
        className="mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-base dark:text-zinc-100"
      />

      {/* Gym Location */}
      <Text className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Gym Location
      </Text>
      <TextInput
        value={gymLocation}
        onChangeText={setGymLocation}
        placeholder="e.g. Downtown Gym"
        placeholderTextColor={colors.placeholder}
        className="mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-base dark:text-zinc-100"
      />

      {/* Start Time */}
      <Text className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Start Time
      </Text>
      <View className="mb-4">
        <DateTimePicker
          value={startTime}
          mode="datetime"
          display="default"
          onChange={handleStartTimeChange}
          themeVariant="dark"
        />
      </View>

      {/* End Time */}
      <Text className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        End Time
      </Text>
      <View className="mb-4">
        <DateTimePicker
          value={endTime}
          mode="datetime"
          display="default"
          onChange={handleEndTimeChange}
          themeVariant="dark"
        />
      </View>

      {/* Duration */}
      <Text className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Duration (minutes)
      </Text>
      <TextInput
        value={String(duration)}
        onChangeText={handleDurationChange}
        keyboardType="numeric"
        className="mb-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-base dark:text-zinc-100"
      />

      {/* Delete */}
      <Pressable
        onPress={handleDelete}
        className="mb-8 flex-row items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-800 py-3.5 active:bg-red-50 dark:active:bg-red-950"
      >
        <Ionicons
          name="trash-outline"
          size={18}
          color={colors.dangerIcon}
        />
        <Text className="text-base font-semibold text-red-500 dark:text-red-400">
          Delete Workout
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function EditWorkoutContent() {
  const { workout } = useWorkoutActions();
  const colors = useThemeColors();
  const router = useRouter();
  const meta = useEditWorkoutMeta();

  const pagerRef = useRef<PagerView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showReorder, setShowReorder] = useState(false);

  const exerciseCount = workout?.exercises.length ?? 0;
  const isOnExerciseSlide =
    workout !== null &&
    activeSlide > 0 &&
    activeSlide <= exerciseCount;

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setActiveSlide(e.nativeEvent.position);
    },
    [],
  );

  const handleExerciseAdded = useCallback(() => {
    if (workout) {
      const newIndex = workout.exercises.length;
      setTimeout(
        () => pagerRef.current?.setPage(newIndex),
        100,
      );
    }
  }, [workout]);

  const handleSave = useCallback(async () => {
    try {
      await meta.save();
      router.back();
      router.back();
    } catch {
      Alert.alert(
        "Save Failed",
        "Could not save workout. Please try again.",
      );
    }
  }, [meta, router]);

  const handleDelete = useCallback(async () => {
    try {
      await meta.deleteWorkout();
      // Navigate back past the details screen too
      router.back();
      router.back();
    } catch {
      Alert.alert(
        "Delete Failed",
        "Could not delete workout. Please try again.",
      );
    }
  }, [meta, router]);

  const handleBack = useCallback(() => {
    if (meta.hasChanges) {
      Alert.alert(
        "Discard Changes",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  }, [meta.hasChanges, router]);

  const handleRemoveCurrentExercise = useCallback(() => {
    if (!workout) return;
    // activeSlide 0 is details page, exercises start at 1
    const exercise = workout.exercises[activeSlide - 1];
    if (!exercise) return;
    Alert.alert(
      "Remove Exercise",
      `Remove ${exercise.exerciseName} from this workout?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            meta.actions?.removeExercise(
              exercise.exerciseId,
            ),
        },
      ],
    );
  }, [workout, activeSlide, meta.actions]);

  if (!workout) return null;

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-zinc-900"
      edges={["top"]}
    >
      {/* Red editing banner */}
      <View className="bg-red-500 px-4 py-2">
        <Text className="text-center text-sm font-bold text-white">
          Editing Workout
        </Text>
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-3 pb-2 pt-2">
        <View className="flex-row items-center gap-2">
          {/* Back */}
          <Pressable
            onPress={handleBack}
            className="h-9 w-9 items-center justify-center rounded-md active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.accentIcon}
            />
          </Pressable>
          {/* Reorder */}
          <Pressable
            onPress={() => setShowReorder(true)}
            className="h-9 w-9 items-center justify-center rounded-md active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <Ionicons
              name="reorder-four"
              size={22}
              color={colors.secondaryText}
            />
          </Pressable>
          {/* Remove current exercise */}
          {isOnExerciseSlide && (
            <Pressable
              onPress={handleRemoveCurrentExercise}
              className="h-9 w-9 items-center justify-center rounded-md active:bg-red-50 dark:active:bg-red-950"
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.dangerIcon}
              />
            </Pressable>
          )}
        </View>

        {/* Save */}
        <Pressable
          onPress={handleSave}
          disabled={meta.isSaving}
          className="rounded-lg bg-blue-500 px-4 py-2 active:bg-blue-600"
          style={{
            opacity: meta.isSaving ? 0.5 : 1,
          }}
        >
          <Text className="font-semibold text-white">
            {meta.isSaving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

      {/* Slide indicator */}
      <View className="flex-row items-center justify-center gap-1 py-1.5">
        {/* Details page dot */}
        <View
          className="h-1.5 rounded-full"
          style={{
            width: activeSlide === 0 ? 16 : 6,
            backgroundColor:
              activeSlide === 0
                ? colors.activeIndicator
                : colors.inactiveIndicator,
          }}
        />
        {/* Exercise dots */}
        {workout.exercises.map((_, i) => (
          <View
            key={i}
            className="h-1.5 rounded-full"
            style={{
              width: i + 1 === activeSlide ? 16 : 6,
              backgroundColor:
                i + 1 === activeSlide
                  ? colors.activeIndicator
                  : colors.inactiveIndicator,
            }}
          />
        ))}
        {/* Add exercise dot */}
        <View
          className="h-1.5 rounded-full"
          style={{
            width:
              activeSlide === exerciseCount + 1 ? 16 : 6,
            backgroundColor:
              activeSlide === exerciseCount + 1
                ? colors.activeIndicator
                : colors.inactiveIndicator,
          }}
        />
      </View>

      {/* PagerView */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {/* Page 0: Workout Details */}
        <View key="details" collapsable={false}>
          <WorkoutDetailsPage onDelete={handleDelete} />
        </View>

        {/* Pages 1..n: Exercises */}
        {workout.exercises.map((exercise) => (
          <View
            key={
              exercise.exerciseId +
              (exercise.profileId || "")
            }
            collapsable={false}
          >
            <ExerciseSlide exercise={exercise} />
          </View>
        ))}

        {/* Page n+1: Add Exercise */}
        <View key="add" collapsable={false}>
          <AddExerciseSlide
            onExerciseAdded={handleExerciseAdded}
          />
        </View>
      </PagerView>

      {/* Reorder Modal */}
      <ReorderModal
        visible={showReorder}
        onClose={() => setShowReorder(false)}
      />
    </SafeAreaView>
  );
}

export default function EditWorkoutScreen() {
  const { workoutId } = useLocalSearchParams<{
    workoutId: string;
  }>();
  const router = useRouter();

  if (!workoutId) {
    router.back();
    return null;
  }

  return (
    <EditWorkoutProvider workoutId={workoutId}>
      <EditWorkoutContent />
    </EditWorkoutProvider>
  );
}
```

**Implementation notes:**

- `WorkoutDetailsPage` manages local form state for
  name/gymLocation/startTime/endTime and syncs back to the
  workout via `state.setWorkout`. This avoids re-rendering
  the whole PagerView on every keystroke.
- `handleSave` calls `router.back()` twice to go past the
  (now stale) details screen back to the workout list.
- The `DateTimePicker` import may need
  `@react-native-community/datetimepicker` to be installed.
  Check if it's already a dependency.

- [ ] **Step 2: Check if DateTimePicker is installed**

Run: `cat apps/mobile/package.json | grep datetimepicker`

If not installed, run:
`cd apps/mobile && bun add @react-native-community/datetimepicker`

- [ ] **Step 3: Verify full project compilation**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -50`

Fix any type errors. Common ones:
- The `exercises` field on the PUT body might need the Eden
  Treaty types to regenerate. Run `cd apps/api && bun run build`
  or restart the TS server if needed.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/(tabs)/stats/workout/edit/[workoutId].tsx
git commit -m "[agent] feat: add workout editor screen with PagerView

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

---

## Task 9: Wire up profiles query for EditWorkoutProvider

**Files:**
- Modify: `apps/mobile/hooks/useEditWorkout.tsx`
  (if needed)

- [ ] **Step 1: Check if `/exercises/profiles` endpoint exists**

Run: `grep -r "profiles" apps/api/src/routes/exercises.ts | head -20`

The `useAllProfiles` query in `useEditWorkout.tsx` calls
`api.api.v1.exercises.profiles.get()`. If this endpoint doesn't
exist, we need to adjust the transform to build display names
from the exercise name alone (without profile suffix), or
query profiles differently.

If the endpoint doesn't exist, change `useAllProfiles` to
return an empty map and build display names from just the
exercise name. The profile name can be derived from the
`exerciseName` stored in the set data if profiles are cached
locally.

Alternatively, look at how the workout details screen currently
gets exercise names (it uses the `exercises` query) and follow
the same pattern.

- [ ] **Step 2: Fix any issues found and verify compilation**

Run: `cd apps/mobile && npx tsc --noEmit --pretty 2>&1 | head -50`

- [ ] **Step 3: Commit if changes were needed**

```bash
git add -A
git commit -m "[agent] fix: adjust profile lookup in edit workout transform

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

---

## Task 10: Smoke test and fix issues

- [ ] **Step 1: Start the API server**

Run: `cd apps/api && bun dev &`

- [ ] **Step 2: Start the mobile app**

Run: `cd apps/mobile && bun start`

- [ ] **Step 3: Test the golden path**

1. Go to Stats → tap a recent workout → verify pencil icon
   shows in top-right
2. Tap pencil → verify edit screen loads with red
   "Editing Workout" banner
3. Verify page 0 shows correct workout name, gym, times
4. Swipe to exercise pages → verify sets are displayed
   correctly
5. Edit a set's reps → verify the value updates
6. Add a set → verify it appears
7. Tap "Save" → verify it saves and navigates back
8. Re-open the workout → verify edits persisted

- [ ] **Step 4: Test edge cases**

1. Edit workout, then tap back → verify discard
   confirmation appears
2. Change duration → verify end time updates
3. Change start time → verify end time stays fixed,
   duration recalculates
4. Change end time → verify duration recalculates
5. Delete workout → verify confirmation, then deletion
6. Add exercise from the add tab
7. Reorder exercises
8. Toggle unilateral on an exercise

- [ ] **Step 5: Fix any issues found**

Fix issues and commit each fix separately.

- [ ] **Step 6: Final commit if needed**

```bash
git add -A
git commit -m "[agent] fix: resolve edit workout smoke test issues

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```
