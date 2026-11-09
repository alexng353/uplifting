-- One-off data change OK'd by Alex on 2026-11-08: his 2026-11-06 reverse incline treadmill
-- walk, logged as 10 reps x 0, becomes 10:00 at 3.5 mph, 3.5% incline. Changes at most one
-- row: nothing happens unless exactly one set matches. Already-converted sets don't match.
CREATE TABLE IF NOT EXISTS "set_conversion_backup" AS SELECT * FROM "user_sets" WITH NO DATA;--> statement-breakpoint
WITH candidates AS (
  SELECT s.*
  FROM "user_sets" s
  JOIN "users" u ON u.id = s.user_id
  JOIN "exercises" e ON e.id = s.exercise_id
  JOIN "workouts" w ON w.id = s.workout_id
  WHERE u.username = 'alex'
    AND lower(e.name) = 'reverse incline treadmill walk'
    AND s.duration_seconds IS NULL AND s.weight = 0 AND s.reps = 10
    AND (w.start_time AT TIME ZONE 'America/Vancouver')::date = DATE '2026-11-06'
), target AS (
  SELECT * FROM candidates WHERE (SELECT count(*) FROM candidates) = 1
), saved AS (
  INSERT INTO "set_conversion_backup" SELECT * FROM target RETURNING id
)
UPDATE "user_sets" SET reps = 1, duration_seconds = 600, speed = 3.5, speed_unit = 'mph',
  incline = 3.5, distance = 0.583, distance_unit = 'mi'
WHERE id IN (SELECT id FROM target);
