import type { StoredPreviousSets, StoredSet, StoredWorkoutExercise } from "../services/storage";
import { rowSets, toRows } from "./set-rows";
import { convertWeight } from "./units";
import { classifyRows, lastWorkingWeight, type WarmupKind } from "./warmup";

type Ex = Pick<
  StoredWorkoutExercise,
  "exerciseId" | "profileId" | "sets" | "exerciseType" | "measure"
>;

/**
 * Last session's sets for an exercise: this profile, else another profile's. Warmups and
 * suggestions both use this, so what the ghost rows suggest and what counts as a warmup agree.
 */
export function previousFor(
  previous: StoredPreviousSets,
  exerciseId: string,
  profileId?: string,
): StoredSet[] {
  const own = previous[`${exerciseId}_${profileId ?? "default"}`];
  if (own?.length) return own;
  const other = Object.entries(previous).find(
    ([k, v]) => k.startsWith(`${exerciseId}_`) && v.length,
  );
  return other?.[1] ?? [];
}

const done = (s: StoredSet) => s.reps != null && s.reps > 0 && s.weight != null;

/** Warmup or working, per row of the exercise as shown. */
export function warmupKinds(exercise: Ex, previous: StoredSet[]): WarmupKind[] {
  const rows = toRows(exercise.sets);
  const unit = exercise.sets[0]?.weightUnit ?? "kg";
  const eligible = exercise.measure !== "timed" && !/bodyweight/i.test(exercise.exerciseType ?? "");
  const prev = previous.map((s) => ({
    ...s,
    weight: s.weight != null ? convertWeight(s.weight, s.weightUnit, unit) : s.weight,
  }));
  return classifyRows(
    rows.map((row) => {
      const sets = rowSets(row);
      const weights = sets.map((s) =>
        s.weight != null ? convertWeight(s.weight, s.weightUnit, unit) : 0,
      );
      return {
        mode: row.kind === "bilateral" ? ("bi" as const) : ("side" as const),
        weight: weights.length ? Math.max(...weights) : null,
        done: sets.length > 0 && sets.every(done),
        flag: sets.find((s) => s.warmup != null)?.warmup,
      };
    }),
    { bi: lastWorkingWeight(prev, "bi"), side: lastWorkingWeight(prev, "side") },
    eligible,
  );
}

/**
 * The sets as they are saved: warmup rows carry warmup: true, everything else none, so
 * the server and history see the final call.
 */
export function withWarmupFlags(exercise: Ex, previous: StoredSet[]): StoredSet[] {
  const kinds = warmupKinds(exercise, previous);
  const warm = new Set<string>();
  toRows(exercise.sets).forEach((row, i) => {
    if (kinds[i] === "warmup") rowSets(row).forEach((s) => warm.add(s.id));
  });
  return exercise.sets.map(({ warmup: _w, ...s }) => (warm.has(s.id) ? { ...s, warmup: true } : s));
}
