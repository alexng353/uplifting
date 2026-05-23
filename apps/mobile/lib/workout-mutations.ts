import {
  generateId,
  getSettings,
  type StoredSet,
  type StoredWorkout,
  type StoredWorkoutExercise,
} from "../services/storage";

/**
 * Pure workout mutation functions.
 *
 * Each function takes a StoredWorkout and returns a new StoredWorkout with the
 * mutation applied. These are shared between the live workout context
 * (useWorkout) and the edit workout context (useEditWorkout).
 */

// --- Private helpers ---

function getBodyweightForExercise(workout: StoredWorkout, exerciseId: string): number | undefined {
  const exercise = workout.exercises.find((e) => e.exerciseId === exerciseId);
  if (exercise?.exerciseType !== "Bodyweight") return undefined;
  const settings = getSettings();
  return settings.bodyweight ?? undefined;
}

// --- Exported mutations ---

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
    bodyweight: exerciseType === "Bodyweight" ? (settings.bodyweight ?? undefined) : undefined,
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

export function removeExerciseMutation(workout: StoredWorkout, exerciseId: string): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.filter((e) => e.exerciseId !== exerciseId),
  };
}

export function reorderExercisesMutation(
  workout: StoredWorkout,
  newOrder: string[],
): StoredWorkout {
  const exerciseMap = new Map(workout.exercises.map((e) => [e.exerciseId, e]));
  const reordered = newOrder
    .map((id) => exerciseMap.get(id))
    .filter((e): e is StoredWorkoutExercise => e !== undefined);

  return { ...workout, exercises: reordered };
}

export function addSetMutation(
  workout: StoredWorkout,
  exerciseId: string,
  weightUnit: string,
  reps?: number,
  weight?: number,
  side?: "L" | "R",
): StoredWorkout {
  const bodyweight = getBodyweightForExercise(workout, exerciseId);
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
      e.exerciseId === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e,
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
  const bodyweight = getBodyweightForExercise(workout, exerciseId);
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
      e.exerciseId === exerciseId ? { ...e, sets: [...e.sets, rightSet, leftSet] } : e,
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
            sets: e.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
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
      e.exerciseId === exerciseId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e,
    ),
  };
}

export function removeLastSetMutation(workout: StoredWorkout, exerciseId: string): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId ? { ...e, sets: e.sets.slice(0, -1) } : e,
    ),
  };
}

export function removeLastUnilateralPairMutation(
  workout: StoredWorkout,
  exerciseId: string,
): StoredWorkout {
  const exercise = workout.exercises.find((e) => e.exerciseId === exerciseId);
  if (!exercise) return workout;

  const rightSets = exercise.sets.filter((s) => s.side === "R");
  const leftSets = exercise.sets.filter((s) => s.side === "L");
  const lastRight = rightSets[rightSets.length - 1];
  const lastLeft = leftSets[leftSets.length - 1];

  const idsToRemove = new Set<string>();
  if (lastRight) idsToRemove.add(lastRight.id);
  if (lastLeft) idsToRemove.add(lastLeft.id);

  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId
        ? { ...e, sets: e.sets.filter((s) => !idsToRemove.has(s.id)) }
        : e,
    ),
  };
}

function isSetEmpty(s: StoredSet): boolean {
  return s.reps == null && s.weight == null;
}

/**
 * Remove trailing empty sets from an exercise, keeping at most `keepCount`
 * empty sets at the end. An "empty" set has neither reps nor weight; for
 * unilateral exercises, a "pair" is empty when both its R and L sides
 * (or the only side present) are empty.
 */
export function trimTrailingEmptySetsMutation(
  workout: StoredWorkout,
  exerciseId: string,
  keepCount: number = 0,
): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;

      if (e.isUnilateral) {
        const rightSets = e.sets.filter((s) => s.side === "R");
        const leftSets = e.sets.filter((s) => s.side === "L");
        const maxLen = Math.max(rightSets.length, leftSets.length);

        let lastNonEmpty = -1;
        for (let i = maxLen - 1; i >= 0; i -= 1) {
          const r = rightSets[i];
          const l = leftSets[i];
          if ((r && !isSetEmpty(r)) || (l && !isSetEmpty(l))) {
            lastNonEmpty = i;
            break;
          }
        }

        const keepUntil = lastNonEmpty + 1 + keepCount;
        if (keepUntil >= maxLen) return e;

        const keepIds = new Set<string>([
          ...rightSets.slice(0, keepUntil).map((s) => s.id),
          ...leftSets.slice(0, keepUntil).map((s) => s.id),
        ]);
        return { ...e, sets: e.sets.filter((s) => keepIds.has(s.id)) };
      }

      let lastNonEmpty = -1;
      for (let i = e.sets.length - 1; i >= 0; i -= 1) {
        if (!isSetEmpty(e.sets[i])) {
          lastNonEmpty = i;
          break;
        }
      }
      const keepUntil = lastNonEmpty + 1 + keepCount;
      if (keepUntil >= e.sets.length) return e;
      return { ...e, sets: e.sets.slice(0, keepUntil) };
    }),
  };
}

export function toggleUnilateralMutation(
  workout: StoredWorkout,
  exerciseId: string,
): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) {
        return e;
      }

      const isCurrentlyUnilateral = e.isUnilateral ?? false;

      if (!isCurrentlyUnilateral) {
        const expandedSets = e.sets.flatMap((set) => {
          if (set.side) {
            return [set];
          }

          const rightSet: StoredSet = { ...set, side: "R" };
          const leftSet: StoredSet = {
            ...set,
            id: generateId(),
            side: "L",
          };
          return [rightSet, leftSet];
        });

        return { ...e, isUnilateral: true, sets: expandedSets };
      }

      const rightSets = e.sets.filter((set) => set.side === "R" || !set.side);
      const leftSets = e.sets.filter((set) => set.side === "L");
      const maxLen = Math.max(rightSets.length, leftSets.length);
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
          weightUnit: rightSet?.weightUnit ?? leftSet?.weightUnit ?? baseSet.weightUnit,
          createdAt: rightSet?.createdAt ?? leftSet?.createdAt ?? baseSet.createdAt,
        });
      }

      return { ...e, isUnilateral: false, sets: mergedSets };
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
      e.exerciseId === exerciseId ? { ...e, profileId, exerciseName } : e,
    ),
  };
}
