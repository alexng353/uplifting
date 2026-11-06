import type { StoredSet, StoredWorkoutExercise } from "../services/storage";
import { toRows } from "./set-rows";

/** Timed rows reuse reps for time and weight for speed, plus incline. */
export type SetField = "reps" | "weight" | "incline";

export interface FieldStop {
  key: string;
  exerciseIndex: number;
}

export function setFieldKey(setId: string, field: SetField): string {
  return `${setId}:${field}`;
}

// Sets in the order ExerciseSlide shows their fields: a unilateral row has one set of
// fields (stored on R, mirrored to L); a split row is an R row then an L row.
function displaySets(exercise: StoredWorkoutExercise): StoredSet[] {
  return toRows(exercise.sets).flatMap((row) => {
    if (row.kind === "bilateral") return [row.set];
    const order = row.layout === "combined" ? [row.right ?? row.left] : [row.right, row.left];
    return order.filter((s): s is StoredSet => s != null);
  });
}

/** Safari-style tab order: reps, weight, next row's reps..., then the next exercise. */
export function setFieldOrder(exercises: StoredWorkoutExercise[]): FieldStop[] {
  return exercises.flatMap((exercise, exerciseIndex) =>
    displaySets(exercise).flatMap((set) =>
      (exercise.measure === "timed"
        ? (["reps", "weight", "incline"] as const)
        : (["reps", "weight"] as const)
      ).map((field) => ({
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
