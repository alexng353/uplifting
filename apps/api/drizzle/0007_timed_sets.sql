ALTER TABLE "exercises" ADD COLUMN "measure" varchar(10) DEFAULT 'weights' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sets" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "user_sets" ADD COLUMN "speed" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "user_sets" ADD COLUMN "speed_unit" varchar(4);--> statement-breakpoint
ALTER TABLE "user_sets" ADD COLUMN "incline" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "user_sets" ADD COLUMN "distance" numeric(8, 3);--> statement-breakpoint
ALTER TABLE "user_sets" ADD COLUMN "distance_unit" varchar(3);
--> statement-breakpoint
-- The first timed exercise. It may already exist (made by the exercise agent), so mark it
-- timed by name, then add it only if missing. Idempotent.
UPDATE "exercises" SET "measure" = 'timed' WHERE lower("name") = 'reverse incline treadmill walk' AND "official";--> statement-breakpoint
INSERT INTO "exercises" ("name", "exercise_type", "official", "description", "measure")
SELECT 'Reverse Incline Treadmill Walk', 'machine', true, 'Walk backwards on an inclined treadmill. Logged by time, with optional speed, incline and distance.', 'timed'
WHERE NOT EXISTS (SELECT 1 FROM "exercises" WHERE lower("name") = 'reverse incline treadmill walk');--> statement-breakpoint
INSERT INTO "exercise_muscle_relations" ("exercise_id", "muscle_id", "is_primary")
SELECT e.id, m.id, x.is_primary
FROM "exercises" e
CROSS JOIN (VALUES ('quadriceps%', true), ('gluteus maximus%', false), ('gastrocnemius%', false)) AS x(pattern, is_primary)
JOIN "muscles" m ON m.name ILIKE x.pattern
WHERE lower(e.name) = 'reverse incline treadmill walk'
  AND NOT EXISTS (SELECT 1 FROM "exercise_muscle_relations" r WHERE r.exercise_id = e.id);
