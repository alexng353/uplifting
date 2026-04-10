# Rest Day Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent duplicate rest days, add mutual exclusion between rest/workout days, and show an immediate "Rest Day" view in the workout tab with cancel support.

**Architecture:** Hybrid local-first + server reconciliation. A `TODAY_REST_DAY` storage key provides instant UI state. Server data reconciles on mount/refresh. Server-side dedup in `POST /sync/workout` is the safety net for multi-device races.

**Tech Stack:** React Native (Expo), Elysia, Drizzle ORM, TanStack React Query, AsyncStorage (via sync cache layer)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/mobile/services/storage.ts` | Modify | Add `TodayRestDay` type, storage key, CRUD helpers, date utility |
| `apps/api/src/routes/sync.ts` | Modify | Add dedup check for `kind = "rest"` before insert |
| `apps/mobile/hooks/useWorkout.tsx` | Modify | Add `todayRestDay` state, `cancelRestDay`, `reconcileRestDay`, update `logRestDay` |
| `apps/mobile/hooks/useSync.tsx` | Modify | Write `syncedWorkoutId` to storage after rest day sync; handle cancel-while-syncing race |
| `apps/mobile/app/(tabs)/workout.tsx` | Modify | Add rest day render branch, reconciliation effect, cancel handler, hide rest day button when today has workouts |

---

### Task 1: Storage Layer — TodayRestDay

**Files:**
- Modify: `apps/mobile/services/storage.ts`

- [ ] **Step 1: Add TodayRestDay type and storage key**

Add to the `STORAGE_KEYS` object and add the new type and helpers after the existing exercise sequence functions at the end of the file:

```typescript
// In STORAGE_KEYS, add:
TODAY_REST_DAY: "today_rest_day",
```

```typescript
// After the ExerciseSequenceEntry types (around line 167):
export interface TodayRestDay {
  workoutId: string;         // local StoredWorkout.id
  date: string;              // YYYY-MM-DD for staleness check
  startTime: string;         // ISO timestamp for multi-device dedup
  syncedWorkoutId?: string;  // server workout ID after sync
}
```

- [ ] **Step 2: Add date utility and CRUD functions**

Add at the end of the file, after `getLastProfileForExerciseAtGym`:

```typescript
// --- Date helpers ---

export function getLocalDateString(date?: Date | string): string {
  const d = date ? (typeof date === "string" ? new Date(date) : date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// --- Today rest day operations ---

export function getTodayRestDay(): TodayRestDay | null {
  return getJSON<TodayRestDay>(STORAGE_KEYS.TODAY_REST_DAY);
}

export function setTodayRestDay(data: TodayRestDay): void {
  setJSON(STORAGE_KEYS.TODAY_REST_DAY, data);
}

export function clearTodayRestDay(): void {
  deleteKey(STORAGE_KEYS.TODAY_REST_DAY);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/services/storage.ts
git commit -m "feat: add TodayRestDay storage type and helpers"
```

---

### Task 2: Server-Side Dedup

**Files:**
- Modify: `apps/api/src/routes/sync.ts`

- [ ] **Step 1: Add dedup check in POST /sync/workout**

In the `POST /sync/workout` handler, add a dedup check before the transaction. No new imports needed — the file already has `sql`, `workouts`, and `userSets`.

Replace the entire `async ({ userId, body }) => {` handler function with:

```typescript
    async ({ userId, body }) => {
      // Dedup: if this is a rest day, check for existing one on the same date
      if (body.kind === "rest") {
        const startDate = new Date(body.start_time);
        const existing = await sql`
          SELECT id FROM workouts
          WHERE user_id = ${userId}
            AND kind = 'rest'
            AND (start_time AT TIME ZONE 'UTC')::date = ${startDate.toISOString().slice(0, 10)}::date
          LIMIT 1
        `;

        if (existing.length > 0) {
          return {
            workout_id: existing[0].id,
            previous_sets: {},
          };
        }
      }

      const workoutId = await db.transaction(async (tx) => {
        // 1. Create the workout
        const [workout] = await tx
          .insert(workouts)
          .values({
            userId,
            name: body.name,
            startTime: new Date(body.start_time),
            endTime: new Date(body.end_time),
            privacy: body.privacy ?? "friends",
            gymLocation: body.gym_location,
            kind: body.kind ?? "workout",
          })
          .returning({ id: workouts.id });

        // 2. Insert all sets
        for (const exercise of body.exercises) {
          for (const s of exercise.sets) {
            await tx.insert(userSets).values({
              userId,
              workoutId: workout.id,
              exerciseId: exercise.exercise_id,
              profileId: exercise.profile_id,
              reps: s.reps,
              weight: String(s.weight),
              weightUnit: s.weight_unit,
              side: s.side,
              bodyweight: s.bodyweight ? String(s.bodyweight) : undefined,
              createdAt: s.created_at ? new Date(s.created_at) : new Date(),
            });
          }
        }

        return workout.id;
      });

      // Fetch updated previous_sets for exercises in this workout
      const exerciseIds = body.exercises.map((e) => e.exercise_id);

      const previousSetsRows = exerciseIds.length > 0
        ? await sql`
            WITH ranked_sets AS (
                SELECT s.exercise_id, s.profile_id, s.reps, s.weight, s.weight_unit, s.side, s.created_at,
                    DENSE_RANK() OVER (
                        PARTITION BY s.exercise_id, COALESCE(s.profile_id, '00000000-0000-0000-0000-000000000000')
                        ORDER BY w.end_time DESC
                    ) as workout_rank
                FROM user_sets s JOIN workouts w ON s.workout_id = w.id
                WHERE s.user_id = ${userId} AND w.end_time IS NOT NULL
                  AND s.exercise_id = ANY(${exerciseIds}::uuid[])
            )
            SELECT exercise_id, profile_id, reps, weight, weight_unit, side
            FROM ranked_sets WHERE workout_rank = 1
            ORDER BY exercise_id, profile_id, created_at ASC
          `
        : [];

      const previousSets: Record<string, Record<string, unknown>[]> = {};
      for (const row of previousSetsRows) {
        const key = `${row.exercise_id}_${row.profile_id ?? "default"}`;
        if (!previousSets[key]) {
          previousSets[key] = [];
        }
        previousSets[key].push({
          exercise_id: row.exercise_id,
          profile_id: row.profile_id,
          reps: row.reps,
          weight: row.weight,
          weight_unit: row.weight_unit,
          side: row.side,
        });
      }

      return {
        workout_id: workoutId,
        previous_sets: previousSets,
      };
    },
```

Note: the rest day dedup check runs BEFORE the transaction. For rest days, `exercises` is always empty so `previousSetsRows` will be empty — the `exerciseIds.length > 0` guard prevents running the query with an empty array.

- [ ] **Step 2: Verify the API compiles**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/sync.ts
git commit -m "feat: add server-side dedup for rest days in sync endpoint"
```

---

### Task 3: WorkoutProvider — Rest Day State

**Files:**
- Modify: `apps/mobile/hooks/useWorkout.tsx`

- [ ] **Step 1: Add imports and types**

Update the imports from `storage.ts` to include the new functions. Replace the existing import block:

```typescript
import {
  addExerciseSequence,
  clearTodayRestDay,
  generateId,
  getCurrentWorkout,
  getLocalDateString,
  getPendingWorkout,
  getSettings,
  getTodayRestDay,
  setTodayRestDay,
  type StoredSet,
  type StoredWorkout,
  type StoredWorkoutExercise,
  type TodayRestDay,
  setCurrentWorkout,
  setPendingWorkout,
  updatePreviousSets,
} from "../services/storage";
```

Update the `WorkoutContextValue` interface — change `logRestDay` return type and add new members:

```typescript
interface WorkoutContextValue {
  workout: StoredWorkout | null;
  isActive: boolean;
  todayRestDay: TodayRestDay | null;
  startWorkout: () => void;
  logRestDay: () => StoredWorkout | null;
  cancelRestDay: () => string | undefined;
  reconcileRestDay: (serverWorkouts: any[]) => void;
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
  finishWorkout: (name?: string, gymLocation?: string) => StoredWorkout;
  cancelWorkout: () => void;
  hasPendingWorkout: boolean;
}
```

- [ ] **Step 2: Add todayRestDay state and mount logic**

Inside `WorkoutProvider`, add new state after the existing `hasPendingWorkout` state:

```typescript
const [todayRestDayState, setTodayRestDayState] = useState<TodayRestDay | null>(null);
```

In the existing `useEffect` (the mount effect that loads the current workout), add rest day loading at the end, after the `if (current)` block but still inside the effect:

```typescript
    // Load today's rest day from storage
    const storedRestDay = getTodayRestDay();
    if (storedRestDay && storedRestDay.date === getLocalDateString()) {
      setTodayRestDayState(storedRestDay);
    } else if (storedRestDay) {
      clearTodayRestDay(); // Stale — different day
    }
```

- [ ] **Step 3: Update logRestDay to save TODAY_REST_DAY**

Replace the existing `logRestDay` callback:

```typescript
  const logRestDay = useCallback((): StoredWorkout | null => {
    if (todayRestDayState) return null; // Already a rest day today

    const settings = getSettings();
    const now = new Date().toISOString();
    const restDay: StoredWorkout = {
      id: generateId(),
      startTime: now,
      exercises: [],
      privacy: settings.defaultPrivacy,
      kind: "rest",
      name: "Rest Day",
    };

    const pointer: TodayRestDay = {
      workoutId: restDay.id,
      date: getLocalDateString(),
      startTime: now,
    };
    setTodayRestDay(pointer);
    setTodayRestDayState(pointer);

    setPendingWorkout(restDay);
    setHasPendingWorkout(true);

    return restDay;
  }, [todayRestDayState]);
```

- [ ] **Step 4: Add cancelRestDay**

Add after `logRestDay`:

```typescript
  const cancelRestDay = useCallback((): string | undefined => {
    const current = getTodayRestDay();
    const syncedId = current?.syncedWorkoutId;

    clearTodayRestDay();
    setTodayRestDayState(null);

    // Clear pending if not yet synced
    const pending = getPendingWorkout();
    if (pending && pending.kind === "rest") {
      setPendingWorkout(null);
      setHasPendingWorkout(false);
    }

    return syncedId;
  }, []);
```

- [ ] **Step 5: Add reconcileRestDay**

Add after `cancelRestDay`:

```typescript
  const reconcileRestDay = useCallback((serverWorkouts: any[]) => {
    const today = getLocalDateString();
    const serverRestDay = serverWorkouts.find((w: any) => {
      return getLocalDateString(w.startTime) === today && w.kind === "rest";
    });

    const local = getTodayRestDay();

    if (serverRestDay && !local) {
      // Server has rest day, local doesn't — adopt (logged on another device)
      const pointer: TodayRestDay = {
        workoutId: serverRestDay.id,
        date: today,
        startTime: serverRestDay.startTime,
        syncedWorkoutId: serverRestDay.id,
      };
      setTodayRestDay(pointer);
      setTodayRestDayState(pointer);
    } else if (local && serverRestDay && !local.syncedWorkoutId) {
      // Local was pending, server now has it — update with server ID
      const updated: TodayRestDay = {
        ...local,
        syncedWorkoutId: serverRestDay.id,
      };
      setTodayRestDay(updated);
      setTodayRestDayState(updated);
    }
    // If local has rest day but server doesn't → still pending sync, keep local
    // If neither has rest day → nothing to do
  }, []);
```

- [ ] **Step 6: Update startWorkout to guard against rest day**

Add a guard at the top of the existing `startWorkout` callback:

```typescript
  const startWorkout = useCallback(() => {
    if (todayRestDayState) return; // Can't start workout on a rest day

    const settings = getSettings();
    const newWorkout: StoredWorkout = {
      id: generateId(),
      startTime: new Date().toISOString(),
      exercises: [],
      privacy: settings.defaultPrivacy,
      kind: "workout",
    };
    saveWorkout(newWorkout);

    // Auto-detect nearby gym (fire-and-forget)
    detectAndSetNearbyGym().catch(() => {});
  }, [saveWorkout, todayRestDayState]);
```

- [ ] **Step 7: Update context provider value**

Update the `value` prop of `WorkoutContext.Provider` to include the new members:

```typescript
    <WorkoutContext.Provider
      value={{
        workout,
        isActive: workout !== null,
        todayRestDay: todayRestDayState,
        startWorkout,
        logRestDay,
        cancelRestDay,
        reconcileRestDay,
        addExercise,
        removeExercise,
        reorderExercises,
        addSet,
        addUnilateralPair,
        updateSet,
        removeSet,
        removeLastSet,
        removeLastUnilateralPair,
        toggleUnilateral,
        changeExerciseProfile,
        finishWorkout,
        cancelWorkout,
        hasPendingWorkout,
      }}
    >
```

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/hooks/useWorkout.tsx
git commit -m "feat: add rest day state management to WorkoutProvider"
```

---

### Task 4: Sync Hook — Rest Day Awareness

**Files:**
- Modify: `apps/mobile/hooks/useSync.tsx`

- [ ] **Step 1: Add imports**

Add the new storage imports to the existing import block:

```typescript
import {
  getLastSyncTime,
  getPendingWorkout,
  getTodayRestDay,
  setTodayRestDay,
  type StoredWorkout,
  setLastSyncTime,
  setPendingWorkout,
  updatePreviousSets,
  generateId,
} from "../services/storage";
```

Also import the API client:

```typescript
import { api } from "../lib/api";
```

- [ ] **Step 2: Update onSyncSuccess to handle rest day sync**

Update the `onSyncSuccess` callback to accept the second `localData` argument and handle rest days. Replace the existing `onSyncSuccess`:

```typescript
  const onSyncSuccess = useCallback(
    async (response: any, localData: StoredWorkout) => {
      // Handle rest day sync completion
      if (localData.kind === "rest") {
        const currentRestDay = getTodayRestDay();
        if (currentRestDay) {
          // Rest day still active — save the synced server ID
          setTodayRestDay({
            ...currentRestDay,
            syncedWorkoutId: response.workout_id,
          });
        } else {
          // User cancelled while sync was in-flight — delete from server
          try {
            await (api.api.v1.workouts as any)[response.workout_id].delete();
          } catch {
            // Best-effort cleanup
          }
        }
      }

      if (response.previous_sets) {
        for (const [key, sets] of Object.entries(
          response.previous_sets as Record<string, any[]>,
        )) {
          const parts = key.split("_");
          const exerciseId = parts[0];
          const profileId = parts.slice(1).join("_");
          updatePreviousSets(
            exerciseId,
            profileId === "default" ? null : profileId,
            (sets as any[]).map((s) => ({
              id: generateId(),
              reps: s.reps,
              weight: Number(s.weight),
              weightUnit: s.weight_unit ?? s.weightUnit,
              createdAt: new Date().toISOString(),
              side: s.side as "L" | "R" | undefined,
            })),
          );
        }
      }
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      queryClient.invalidateQueries({ queryKey: ["all-time-stats"] });
    },
    [queryClient],
  );
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hooks/useSync.tsx
git commit -m "feat: handle rest day sync completion and cancel-while-syncing race"
```

---

### Task 5: Workout Tab — UI and Reconciliation

**Files:**
- Modify: `apps/mobile/app/(tabs)/workout.tsx`

- [ ] **Step 1: Add imports**

Add these imports to the existing import block at the top of the file:

```typescript
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkouts } from "../../hooks/useWorkouts";
import { getLocalDateString } from "../../services/storage";
import { api } from "../../lib/api";
```

Update the `useCallback` import on line 1 to also include `useMemo` (it's already being added above, so just make sure the React import has: `useCallback, useEffect, useMemo, useRef, useState`).

- [ ] **Step 2: Add new hooks and derived state**

Inside `WorkoutScreen`, add after the existing `useThemeColors` call:

```typescript
  const queryClient = useQueryClient();
  const { data: serverWorkouts } = useWorkouts(1, 20);
```

Destructure the new context values — update the `useWorkout()` destructure:

```typescript
  const {
    workout,
    isActive,
    todayRestDay,
    startWorkout,
    logRestDay,
    cancelRestDay,
    reconcileRestDay,
    removeExercise,
    finishWorkout,
    cancelWorkout,
  } = useWorkout();
```

Add derived state for whether today has workouts:

```typescript
  const todayHasWorkouts = useMemo(() => {
    if (!serverWorkouts) return false;
    const today = getLocalDateString();
    return serverWorkouts.some(
      (w: any) => getLocalDateString(w.startTime) === today && w.kind === "workout",
    );
  }, [serverWorkouts]);
```

- [ ] **Step 3: Add reconciliation effect**

Add after the existing effects (after the `handlePageSelected` declaration is fine, or group with the other effects):

```typescript
  // Reconcile local rest day state with server data
  useEffect(() => {
    if (serverWorkouts) {
      reconcileRestDay(serverWorkouts);
    }
  }, [serverWorkouts, reconcileRestDay]);
```

- [ ] **Step 4: Add cancel rest day handler**

Add after the existing `handleLogRestDay`:

```typescript
  const handleCancelRestDay = useCallback(async () => {
    const syncedWorkoutId = cancelRestDay();
    if (syncedWorkoutId) {
      try {
        await (api.api.v1.workouts as any)[syncedWorkoutId].delete();
      } catch {
        // Best-effort — server reconciliation will clean up
      }
    }
    queryClient.invalidateQueries({ queryKey: ["workouts"] });
    queryClient.invalidateQueries({ queryKey: ["streak"] });
    queryClient.invalidateQueries({ queryKey: ["all-time-stats"] });
  }, [cancelRestDay, queryClient]);
```

- [ ] **Step 5: Add rest day render branch**

In the render section, add the rest day branch BEFORE the idle state check (before `if (!isActive)`). The order of render branches should be:

1. Active workout (existing — `isActive` is true)
2. Rest day (new — `todayRestDay` is set)
3. Idle (existing — fallthrough)

Replace the `if (!isActive)` idle block with the rest day check + idle block:

```typescript
  // --- Rest day state ---
  if (!isActive && todayRestDay) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900" edges={["top"]}>
        <View className="px-4 pb-2 pt-4">
          <Text className="text-3xl font-bold dark:text-zinc-100">Rest Day</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="bed-outline" size={64} color={colors.secondaryText} />
          <Text className="mt-4 mb-2 text-xl font-semibold dark:text-zinc-100">
            You're resting today
          </Text>
          <Text className="mb-6 text-center text-base text-zinc-500 dark:text-zinc-400">
            Recovery is part of the process.
          </Text>
          <Pressable
            onPress={handleCancelRestDay}
            className="w-full flex-row items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-800 py-3.5 active:bg-red-50 dark:active:bg-red-950"
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.dangerIcon} />
            <Text className="text-base font-semibold text-red-500 dark:text-red-400">
              Cancel Rest Day
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --- Idle state (no active workout) ---
  if (!isActive) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900" edges={["top"]}>
        <View className="px-4 pb-2 pt-4">
          <Text className="text-3xl font-bold dark:text-zinc-100">Workout</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-xl font-semibold dark:text-zinc-100">Ready to train?</Text>
          <Text className="mb-6 text-center text-base text-zinc-500 dark:text-zinc-400">
            Start a new workout session to begin logging your exercises.
          </Text>
          <Pressable
            onPress={startWorkout}
            className="mb-3 w-full items-center rounded-lg bg-blue-500 py-3.5 active:bg-blue-600"
          >
            <Text className="text-base font-semibold text-white">
              Start Workout
            </Text>
          </Pressable>
          {!todayHasWorkouts && (
            <Pressable
              onPress={handleLogRestDay}
              className="w-full flex-row items-center justify-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-600 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
            >
              <Ionicons name="bed-outline" size={18} color={colors.secondaryText} />
              <Text className="text-base font-semibold text-zinc-600 dark:text-zinc-300">
                Log Rest Day
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app/\(tabs\)/workout.tsx
git commit -m "feat: add rest day UI branch, reconciliation, and cancel handler"
```

---

### Task 6: Lint, Format, and Final Commit

- [ ] **Step 1: Run linter/formatter**

```bash
cd /home/alex/code/uplifting && npx prettier --write apps/mobile/services/storage.ts apps/mobile/hooks/useWorkout.tsx apps/mobile/hooks/useSync.tsx "apps/mobile/app/(tabs)/workout.tsx" apps/api/src/routes/sync.ts
```

- [ ] **Step 2: Type-check mobile app**

```bash
cd apps/mobile && npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 3: Type-check API**

```bash
cd apps/api && npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 4: Commit any lint/type fixes**

```bash
git add -A && git commit -m "chore: lint and type fixes for rest day management"
```

(Skip if no changes.)

- [ ] **Step 5: Push**

```bash
git push
```
