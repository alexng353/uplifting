import type { StoredSet, StoredWorkoutExercise } from "../services/storage";
import { rowSets, toRows } from "./set-rows";

/** A set counts once it has reps, the same rule finishWorkout uses before saving. */
export function isLoggedSet(set: StoredSet): boolean {
  return set.reps != null && set.reps > 0;
}

export interface SummaryExercise {
  exerciseId: string;
  exerciseName: string;
  /** Numbered sets as the workout screen shows them (an L/R pair is one set). */
  setCount: number;
  /** One label per logged set: bilateral as-is, pairs as `… L/R` or `R … · L …`. */
  labels: string[];
}

export interface WorkoutSummaryStats {
  exercises: SummaryExercise[];
  totalSets: number;
  totalReps: number;
  totalVolume: number;
}

/**
 * What the Finish sheet shows. Empty rows and grey suggestions are left out, so the
 * numbers match what is saved and synced. Reps and volume count both sides of a pair.
 */
export function summarizeWorkout(
  exercises: Pick<StoredWorkoutExercise, "exerciseId" | "exerciseName" | "sets">[],
  format: (set: StoredSet) => string,
): WorkoutSummaryStats {
  let totalReps = 0;
  let totalVolume = 0;
  const out: SummaryExercise[] = [];
  for (const exercise of exercises) {
    const labels: string[] = [];
    for (const row of toRows(exercise.sets)) {
      const logged = rowSets(row).filter(isLoggedSet);
      if (logged.length === 0) continue;
      for (const s of logged) {
        totalReps += s.reps ?? 0;
        totalVolume += (s.reps ?? 0) * (s.weight ?? 0);
      }
      if (row.kind === "bilateral") {
        labels.push(format(row.set));
        continue;
      }
      const right = row.right && isLoggedSet(row.right) ? row.right : undefined;
      const left = row.left && isLoggedSet(row.left) ? row.left : undefined;
      if (right && left && format(right) === format(left)) {
        labels.push(`${format(right)} L/R`);
      } else {
        labels.push(
          [right && `R ${format(right)}`, left && `L ${format(left)}`].filter(Boolean).join(" · "),
        );
      }
    }
    if (labels.length === 0) continue;
    out.push({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      setCount: labels.length,
      labels,
    });
  }
  const totalSets = out.reduce((sum, e) => sum + e.setCount, 0);
  return { exercises: out, totalSets, totalReps, totalVolume };
}
