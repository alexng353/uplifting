/**
 * Backfill `user_sets.position` for rows created before the column existed.
 *
 * Assigns each exercise group (workout + exercise + profile) a 0-based index
 * within its workout, ordered by the group's earliest set. All sets in a group
 * share the group's position; set order within a group stays createdAt-based.
 *
 * Idempotent — safe to run multiple times. Run once after the 0003 migration:
 *   DATABASE_URL=... bun src/db/backfill-positions.ts
 *
 * Note: existing workouts already display correctly without this (the
 * `ORDER BY position, created_at` falls back to createdAt when every row is at
 * the default position 0). This just makes `position` authoritative so future
 * reorders of legacy workouts behave consistently.
 */
import { sql } from "./index";

const result = await sql`
  WITH groups AS (
    SELECT workout_id, exercise_id, profile_id, MIN(created_at) AS first_at
    FROM user_sets
    GROUP BY workout_id, exercise_id, profile_id
  ), ranked AS (
    SELECT workout_id, exercise_id, profile_id,
           (DENSE_RANK() OVER (
              PARTITION BY workout_id
              ORDER BY first_at, exercise_id, profile_id
           ) - 1) AS pos
    FROM groups
  )
  UPDATE user_sets s
  SET position = r.pos
  FROM ranked r
  WHERE s.workout_id = r.workout_id
    AND s.exercise_id = r.exercise_id
    AND s.profile_id IS NOT DISTINCT FROM r.profile_id
    AND s.position IS DISTINCT FROM r.pos
`;

console.log(`Backfilled position on ${result.count} set rows.`);
await sql.end();
