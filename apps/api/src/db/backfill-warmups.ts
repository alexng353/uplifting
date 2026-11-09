/**
 * Backfills user_sets.is_warmup on sessions logged before warmups existed, with the app's
 * rule (apps/mobile/lib/previous-sets splitSession): within one workout, exercise,
 * profile and mode (bilateral or per side), sets before the first one at 80% of that
 * session's top weight were warmups. Skips timed sets, bodyweight exercises, weightless
 * sessions, and any session that already has a warmup flag.
 *
 *   DATABASE_URL=... bun src/db/backfill-warmups.ts                 # dry run: counts only
 *   DATABASE_URL=... bun src/db/backfill-warmups.ts --apply FILE    # save before-state, then write
 *
 * Undo: UPDATE user_sets SET is_warmup = false WHERE id IN (ids in FILE).
 */
import postgres from "postgres";

export const CANDIDATES = `
  WITH s AS (
    SELECT s.id, s.user_id, s.exercise_id, s.workout_id, s.profile_id, s.side,
      (CASE WHEN s.weight_unit = 'lbs' THEN s.weight * 0.453592 ELSE s.weight END) AS kg,
      ROW_NUMBER() OVER (
        PARTITION BY s.workout_id, s.exercise_id, s.profile_id, (s.side IS NOT NULL)
        ORDER BY s.created_at, s.id
      ) AS ord
    FROM user_sets s
    JOIN exercises e ON e.id = s.exercise_id
    WHERE s.duration_seconds IS NULL AND e.exercise_type <> 'bodyweight' AND e.measure <> 'timed'
  ), g AS (
    SELECT workout_id, exercise_id, profile_id, (side IS NOT NULL) AS sided, MAX(kg) AS top
    FROM s GROUP BY 1, 2, 3, 4
  ), flagged AS (
    SELECT DISTINCT workout_id, exercise_id, profile_id, (side IS NOT NULL) AS sided
    FROM user_sets WHERE is_warmup
  ), first_work AS (
    SELECT s.workout_id, s.exercise_id, s.profile_id, (s.side IS NOT NULL) AS sided, MIN(s.ord) AS ord
    FROM s JOIN g ON g.workout_id = s.workout_id AND g.exercise_id = s.exercise_id
      AND g.profile_id IS NOT DISTINCT FROM s.profile_id AND g.sided = (s.side IS NOT NULL)
    WHERE g.top > 0 AND s.kg >= g.top * 0.8
    GROUP BY 1, 2, 3, 4
  )
  SELECT s.id, s.user_id, s.exercise_id, s.workout_id
  FROM s
  JOIN first_work f ON f.workout_id = s.workout_id AND f.exercise_id = s.exercise_id
    AND f.profile_id IS NOT DISTINCT FROM s.profile_id AND f.sided = (s.side IS NOT NULL)
  WHERE s.ord < f.ord
    AND NOT EXISTS (
      SELECT 1 FROM flagged x WHERE x.workout_id = s.workout_id AND x.exercise_id = s.exercise_id
        AND x.profile_id IS NOT DISTINCT FROM s.profile_id AND x.sided = (s.side IS NOT NULL)
    )
`;

if (import.meta.main) {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const applyAt = process.argv.indexOf("--apply");
  const file = applyAt >= 0 ? process.argv[applyAt + 1] : null;
  const rows = await sql.unsafe(CANDIDATES);
  const summary = await sql.unsafe(`
    WITH c AS (${CANDIDATES})
    SELECT u.username, e.name, COUNT(*)::int AS sets, COUNT(DISTINCT c.workout_id)::int AS workouts
    FROM c JOIN users u ON u.id = c.user_id JOIN exercises e ON e.id = c.exercise_id
    GROUP BY 1, 2 ORDER BY 1, 3 DESC
  `);
  const [total] = await sql`SELECT COUNT(*)::int AS n FROM user_sets`;
  console.log(`${rows.length} of ${total.n} sets would be marked warmup`);
  for (const r of summary)
    console.log(`  ${r.username}\t${r.name}\t${r.sets} sets in ${r.workouts} workouts`);
  if (applyAt >= 0) {
    if (!file) throw new Error("--apply needs a before-state file path");
    // Before-state: every row about to change has is_warmup = false today.
    await Bun.write(
      file,
      JSON.stringify({ at: new Date().toISOString(), ids: rows.map((r) => r.id) }),
    );
    const ids = rows.map((r) => r.id as string);
    if (ids.length)
      await sql`UPDATE user_sets SET is_warmup = true WHERE id = ANY(${ids}::uuid[]) AND NOT is_warmup`;
    console.log(`applied; before-state in ${file}`);
  }
  await sql.end();
}
