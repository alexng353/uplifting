import type { StoredSet, StoredWorkoutExercise } from "../services/storage";
import { sideModeOf } from "./side-mode";

export type SetField = "reps" | "weight";

export interface FieldStop {
  key: string;
  exerciseIndex: number;
}

export function setFieldKey(setId: string, field: SetField): string {
  return `${setId}:${field}`;
}

// Fields in the order ExerciseSlide shows them: split pairs are an R row then an L row;
// a combined (unilateral) row shows L then R.
function displayRows(exercise: StoredWorkoutExercise): StoredSet[] {
  if (!exercise.isUnilateral) return exercise.sets;
  const right = exercise.sets.filter((set) => set.side === "R");
  const left = exercise.sets.filter((set) => set.side === "L");
  // Same rule as ExerciseSlide: a lopsided pair makes the whole exercise show split rows.
  const combined = sideModeOf(exercise) === "unilateral" && right.length === left.length;
  const rows: StoredSet[] = [];
  for (let i = 0; i < Math.max(right.length, left.length); i++) {
    const [first, second] = combined ? [left[i], right[i]] : [right[i], left[i]];
    if (first) rows.push(first);
    if (second) rows.push(second);
  }
  return rows;
}

/** Safari-style tab order: reps, weight, next row's reps..., then the next exercise. */
export function setFieldOrder(exercises: StoredWorkoutExercise[]): FieldStop[] {
  return exercises.flatMap((exercise, exerciseIndex) =>
    displayRows(exercise).flatMap((set) =>
      (["reps", "weight"] as const).map((field) => ({
        key: setFieldKey(set.id, field),
        exerciseIndex,
      })),
    ),
  );
}

export function neighbourStop(
  stops: FieldStop[],
  key: string | null,
  direction: 1 | -1,
): FieldStop | null {
  const index = stops.findIndex((stop) => stop.key === key);
  if (index < 0) return null;
  return stops[index + direction] ?? null;
}
