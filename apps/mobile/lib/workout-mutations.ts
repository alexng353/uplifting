import {
  generateId,
  getSettings,
  getExercises,
  getSideDefault,
  type StoredSet,
  type StoredWorkout,
  type StoredWorkoutExercise,
} from "../services/storage";
import { convertRow, fromRows, isRowEmpty, rowSets, toRows, type SideMode } from "./set-rows";

// isUnilateral now only means "has sided sets"; keep it in step with the rows.
function withSets(e: StoredWorkoutExercise, sets: StoredSet[]): StoredWorkoutExercise {
  return { ...e, sets, isUnilateral: sets.some((s) => s.side != null) };
}

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

  const measure = getExercises().find((e) => e.id === exerciseId)?.measure;
  const newExercise: StoredWorkoutExercise = {
    exerciseId,
    exerciseName,
    exerciseType,
    ...(measure === "timed" ? { measure } : null),
    profileId,
    sets: [firstSet],
  };
  const sideDefault = measure === "timed" ? null : getSideDefault(exerciseId);
  if (sideDefault && sideDefault !== "bilateral") {
    const layout = sideDefault === "unilateral" ? { layout: "combined" as const } : {};
    newExercise.isUnilateral = true;
    newExercise.sets = [
      { ...firstSet, side: "R", ...layout },
      { ...firstSet, id: generateId(), side: "L", ...layout },
    ];
  }

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
  autoAdded?: boolean,
  extra?: Partial<StoredSet>,
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
    ...(autoAdded ? { autoAdded } : {}),
    ...extra,
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
  layout?: "combined",
  autoAdded?: boolean,
): StoredWorkout {
  const bodyweight = getBodyweightForExercise(workout, exerciseId);
  const auto = autoAdded ? { autoAdded } : {};
  const rightSet: StoredSet = {
    id: generateId(),
    reps,
    weight,
    weightUnit,
    createdAt: new Date().toISOString(),
    side: "R",
    bodyweight,
    ...(layout ? { layout } : {}),
    ...auto,
  };

  const leftSet: StoredSet = {
    id: generateId(),
    reps,
    weight,
    weightUnit,
    createdAt: new Date().toISOString(),
    side: "L",
    bodyweight,
    ...(layout ? { layout } : {}),
    ...auto,
  };

  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId ? withSets(e, [...e.sets, rightSet, leftSet]) : e,
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
  // Removes the last row: one bilateral set or a whole L/R pair.
  return {
    ...workout,
    exercises: workout.exercises.map((e) =>
      e.exerciseId === exerciseId ? withSets(e, fromRows(toRows(e.sets).slice(0, -1))) : e,
    ),
  };
}

export function removeLastUnilateralPairMutation(
  workout: StoredWorkout,
  exerciseId: string,
): StoredWorkout {
  return removeLastSetMutation(workout, exerciseId);
}

/**
 * Warmup rows go above the working rows, as shown and as saved (the server keeps set
 * order). The classifier never calls a set below a logged working set a warmup, so only
 * empty (ghost) rows move down: a warmup logged in the third row while sets 1 and 2 were
 * still ghosts showed under them (Alex, build 35, shoulder press).
 */
export function moveWarmupsFirstMutation(
  workout: StoredWorkout,
  exerciseId: string,
  warmupSetIds: readonly string[],
): StoredWorkout {
  const warm = new Set(warmupSetIds);
  return {
    ...workout,
    exercises: workout.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const rows = toRows(e.sets);
      const isWarm = (r: (typeof rows)[number]) => rowSets(r).some((s) => warm.has(s.id));
      const ordered = [...rows.filter(isWarm), ...rows.filter((r) => !isWarm(r))];
      if (ordered.every((r, i) => r === rows[i])) return e;
      return withSets(e, fromRows(ordered));
    }),
  };
}

export function trimTrailingEmptySetsMutation(
  workout: StoredWorkout,
  exerciseId: string,
  keepCount: number = 0,
): StoredWorkout {
  // Keep at most `keepCount` trailing empty rows that the app auto-added. Rows he added
  // himself (Add Set, or the first ghost row) are never trimmed: Alex added two sets,
  // typed into the first, and the blur trim deleted his third (build 31).
  return {
    ...workout,
    exercises: workout.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const rows = toRows(e.sets);
      const trimmable = (i: number) =>
        isRowEmpty(rows[i]) && rowSets(rows[i]).every((s) => s.autoAdded === true);
      let lastKept = rows.length - 1;
      while (lastKept >= 0 && trimmable(lastKept)) lastKept -= 1;
      const keepUntil = lastKept + 1 + keepCount;
      if (keepUntil >= rows.length) return e;
      return withSets(e, fromRows(rows.slice(0, keepUntil)));
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

export function setRowModeMutation(
  workout: StoredWorkout,
  exerciseId: string,
  rowIndex: number,
  mode: SideMode,
): StoredWorkout {
  return {
    ...workout,
    exercises: workout.exercises.map((e) => {
      if (e.exerciseId !== exerciseId) return e;
      const rows = toRows(e.sets);
      if (!rows[rowIndex]) return e;
      rows[rowIndex] = convertRow(rows[rowIndex], mode, generateId);
      return withSets(e, fromRows(rows));
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
