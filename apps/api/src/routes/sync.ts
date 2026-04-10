import { Elysia, t } from "elysia";
import { db, sql } from "../db";
import { workouts, userSets } from "../db/schema";
import { authPlugin } from "../lib/auth";

export const syncRoutes = new Elysia({ prefix: "/sync" })
  .use(authPlugin)

  // GET /bootstrap — fetch all data needed for app initialization
  .get("/bootstrap", async ({ userId }) => {
    const [gyms, profiles, gymProfileMappings, previousSetsRows] =
      await Promise.all([
        sql`SELECT * FROM user_gyms WHERE user_id = ${userId} ORDER BY created_at ASC`,
        sql`SELECT * FROM exercise_profiles WHERE user_id = ${userId} ORDER BY exercise_id, name`,
        sql`SELECT gym_id, exercise_id, profile_id FROM user_gym_profile_mappings WHERE user_id = ${userId}`,
        sql`
          WITH ranked_sets AS (
              SELECT s.exercise_id, s.profile_id, s.reps, s.weight, s.weight_unit, s.side, s.created_at,
                  DENSE_RANK() OVER (
                      PARTITION BY s.exercise_id, COALESCE(s.profile_id, '00000000-0000-0000-0000-000000000000')
                      ORDER BY w.end_time DESC
                  ) as workout_rank
              FROM user_sets s JOIN workouts w ON s.workout_id = w.id
              WHERE s.user_id = ${userId} AND w.end_time IS NOT NULL
          )
          SELECT exercise_id, profile_id, reps, weight, weight_unit, side
          FROM ranked_sets WHERE workout_rank = 1
          ORDER BY exercise_id, profile_id, created_at ASC
        `,
      ]);

    // Group previous_sets by key: {exercise_id}_{profile_id || 'default'}
    const previousSets: Record<string, Record<string, unknown>[]> = {};
    for (const row of previousSetsRows) {
      const key = `${row.exercise_id}_${row.profile_id ?? "default"}`;
      if (!previousSets[key]) {
        previousSets[key] = [];
      }
      previousSets[key].push({
        exercise_id: row.exercise_id,
        profile_id: row.profile_id,
        reps: row.reps,
        weight: row.weight,
        weight_unit: row.weight_unit,
        side: row.side,
      });
    }

    return {
      gyms,
      profiles,
      gym_profile_mappings: gymProfileMappings,
      previous_sets: previousSets,
    };
  })

  // POST /workout — sync a completed workout with all sets
  .post(
    "/workout",
    async ({ userId, body }) => {
      // Dedup check for rest days
      if (body.kind === "rest") {
        const startDate = new Date(body.start_time);
        const existing = await sql`
          SELECT id FROM workouts
          WHERE user_id = ${userId}
            AND kind = 'rest'
            AND (start_time AT TIME ZONE 'UTC')::date = ${startDate.toISOString()}::date
          LIMIT 1
        `;
        if (existing.length > 0) {
          return { workout_id: existing[0].id, previous_sets: {} };
        }
      }

      const workoutId = await db.transaction(async (tx) => {
        // 1. Create the workout
        const [workout] = await tx
          .insert(workouts)
          .values({
            userId,
            name: body.name,
            startTime: new Date(body.start_time),
            endTime: new Date(body.end_time),
            privacy: body.privacy ?? "friends",
            gymLocation: body.gym_location,
            kind: body.kind ?? "workout",
          })
          .returning({ id: workouts.id });

        // 2. Insert all sets
        for (const exercise of body.exercises) {
          for (const s of exercise.sets) {
            await tx.insert(userSets).values({
              userId,
              workoutId: workout.id,
              exerciseId: exercise.exercise_id,
              profileId: exercise.profile_id,
              reps: s.reps,
              weight: String(s.weight),
              weightUnit: s.weight_unit,
              side: s.side,
              bodyweight: s.bodyweight ? String(s.bodyweight) : undefined,
              createdAt: s.created_at ? new Date(s.created_at) : new Date(),
            });
          }
        }

        return workout.id;
      });

      // Fetch updated previous_sets for exercises in this workout
      const exerciseIds = body.exercises.map((e) => e.exercise_id);

      const previousSetsRows =
        exerciseIds.length === 0
          ? []
          : await sql`
        WITH ranked_sets AS (
            SELECT s.exercise_id, s.profile_id, s.reps, s.weight, s.weight_unit, s.side, s.created_at,
                DENSE_RANK() OVER (
                    PARTITION BY s.exercise_id, COALESCE(s.profile_id, '00000000-0000-0000-0000-000000000000')
                    ORDER BY w.end_time DESC
                ) as workout_rank
            FROM user_sets s JOIN workouts w ON s.workout_id = w.id
            WHERE s.user_id = ${userId} AND w.end_time IS NOT NULL
              AND s.exercise_id = ANY(${exerciseIds}::uuid[])
        )
        SELECT exercise_id, profile_id, reps, weight, weight_unit, side
        FROM ranked_sets WHERE workout_rank = 1
        ORDER BY exercise_id, profile_id, created_at ASC
      `;

      const previousSets: Record<string, Record<string, unknown>[]> = {};
      for (const row of previousSetsRows) {
        const key = `${row.exercise_id}_${row.profile_id ?? "default"}`;
        if (!previousSets[key]) {
          previousSets[key] = [];
        }
        previousSets[key].push({
          exercise_id: row.exercise_id,
          profile_id: row.profile_id,
          reps: row.reps,
          weight: row.weight,
          weight_unit: row.weight_unit,
          side: row.side,
        });
      }

      return {
        workout_id: workoutId,
        previous_sets: previousSets,
      };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        start_time: t.String(),
        end_time: t.String(),
        privacy: t.Optional(t.String()),
        gym_location: t.Optional(t.String()),
        kind: t.Optional(t.String()),
        exercises: t.Array(
          t.Object({
            exercise_id: t.String(),
            profile_id: t.Optional(t.String()),
            sets: t.Array(
              t.Object({
                reps: t.Number(),
                weight: t.Number(),
                weight_unit: t.String(),
                created_at: t.Optional(t.String()),
                side: t.Optional(t.String()),
                bodyweight: t.Optional(t.Number()),
              }),
            ),
          }),
        ),
      }),
    },
  );
