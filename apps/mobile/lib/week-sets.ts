/** Sets per exercise across this week's workouts, for the Me screen's muscle map. */

export type DetailSet = { reps?: number | string | null; side?: string | null };
export type DetailWorkout = { exercises?: { exercise_id: string; sets?: DetailSet[] }[] | null };

/**
 * Counts real sets (reps above 0). A per-side set counts once, not once per side: per
 * exercise that's the bilateral sets plus the larger of its R and L counts.
 */
export function weekExerciseSets(
  workouts: readonly (DetailWorkout | null | undefined)[],
): { id: string; sets: number }[] {
  const tally = new Map<string, { bi: number; R: number; L: number }>();
  for (const w of workouts) {
    for (const ex of w?.exercises ?? []) {
      const t = tally.get(ex.exercise_id) ?? { bi: 0, R: 0, L: 0 };
      for (const s of ex.sets ?? []) {
        if (!(Number(s.reps) > 0)) continue;
        if (s.side === "R" || s.side === "L") t[s.side] += 1;
        else t.bi += 1;
      }
      tally.set(ex.exercise_id, t);
    }
  }
  return [...tally]
    .map(([id, t]) => ({ id, sets: t.bi + Math.max(t.R, t.L) }))
    .filter((e) => e.sets > 0);
}
