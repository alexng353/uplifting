/**
 * One-off, after migration 0007: Alex logged his first reverse incline treadmill walk
 * (2026-11-06, leg day) as a workaround, reps = 10 (minutes), weight = 0, with speed and
 * incline in the note. This turns exactly those sets into a timed set: 10:00 at 3.5 mph,
 * 3.5% incline. It touches nothing else: only sets of the official timed walk with no
 * duration yet, weight 0, reps 10, in a workout that started on 2026-11-06 (Vancouver).
 *
 *   DATABASE_URL=... bun src/db/convert-treadmill-workaround.ts           # dry run
 *   DATABASE_URL=... bun src/db/convert-treadmill-workaround.ts --apply   # convert
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const apply = process.argv.includes("--apply");

const match = sql`
  FROM user_sets s
  JOIN exercises e ON e.id = s.exercise_id
  JOIN workouts w ON w.id = s.workout_id
  WHERE lower(e.name) = 'reverse incline treadmill walk' AND e.measure = 'timed'
    AND s.duration_seconds IS NULL AND s.weight = 0 AND s.reps = 10
    AND (w.start_time AT TIME ZONE 'America/Vancouver')::date = DATE '2026-11-06'
`;

const rows = await sql`SELECT s.id, s.reps, s.weight, w.start_time ${match}`;
console.log(`${rows.length} set(s) match the workaround pattern`);
for (const r of rows)
  console.log(`  ${r.id} ${r.reps}x${r.weight} ${new Date(r.start_time).toISOString()}`);

if (apply && rows.length > 0) {
  if (rows.length > 1) {
    console.error("More than one match; refusing. Check them by hand.");
    process.exit(1);
  }
  await sql`
    UPDATE user_sets SET reps = 1, duration_seconds = 600, speed = 3.5, speed_unit = 'mph',
      incline = 3.5, distance = 0.583, distance_unit = 'mi'
    WHERE id = ${rows[0].id}
  `;
  console.log("converted");
}
await sql.end();
