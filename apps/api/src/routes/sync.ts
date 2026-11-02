import { Elysia, t } from "elysia";
import { sql as dsql } from "drizzle-orm";
import { db, sql } from "../db";
import { workouts, userSets } from "../db/schema";
import { authPlugin } from "../lib/auth";
import { gateUserId } from "./gate";

export const syncRoutes = new Elysia({ prefix: "/sync" })
  .use(authPlugin)

  // GET /bootstrap — fetch all data needed for app initialization
  .get("/bootstrap", async ({ userId }) => {
    const [gyms, profiles, gymProfileMappings, previousSetsRows, sequenceRows] = await Promise.all([
      sql`SELECT * FROM user_gyms WHERE user_id = ${userId} ORDER BY created_at ASC`,
      sql`SELECT * FROM exercise_profiles WHERE user_id = ${userId} ORDER BY exercise_id, name`,
      sql`SELECT gym_id, exercise_id, profile_id FROM user_gym_profile_mappings WHERE user_id = ${userId}`,
      sql`
          WITH ranked_sets AS (
              SELECT s.exercise_id, s.profile_id, s.reps, s.weight, s.weight_unit, s.side, s.created_at,
                  DENSE_RANK() OVER (
                      PARTITION BY s.exercise_id, s.profile_id, (s.side IS NOT NULL)
                      ORDER BY w.end_time DESC
                  ) as workout_rank
              FROM user_sets s JOIN workouts w ON s.workout_id = w.id
              WHERE s.user_id = ${userId} AND w.end_time IS NOT NULL
          )
          SELECT exercise_id, profile_id, reps, weight, weight_unit, side
          FROM ranked_sets WHERE workout_rank = 1
          ORDER BY exercise_id, profile_id, created_at ASC
        `,
      sql`
          WITH recent AS (
              SELECT id, name, end_time FROM workouts
              WHERE user_id = ${userId} AND end_time IS NOT NULL AND kind = 'workout'
              ORDER BY end_time DESC
              LIMIT 20
          ),
          exercise_order AS (
              SELECT workout_id, exercise_id,
                     MIN(position) AS first_position,
                     MIN(created_at) AS first_seen
              FROM user_sets
              WHERE workout_id IN (SELECT id FROM recent)
              GROUP BY workout_id, exercise_id
          )
          SELECT r.id AS workout_id, r.name AS workout_name, eo.exercise_id
          FROM recent r JOIN exercise_order eo ON eo.workout_id = r.id
          ORDER BY r.end_time DESC, eo.first_position ASC, eo.first_seen ASC
        `,
    ]);

    // Keep the existing key format, with the latest workout's sets for each mode.
    const previousSets: Record<string, Record<string, unknown>[]> = {};
    for (const row of previousSetsRows) {
      const key = `${row.exercise_id}_${row.profile_id ?? "default"}`;
      if (!previousSets[key]) {
        previousSets[key] = [];
      }
      previousSets[key].push({
        exercise_id: row.exercise_id,
        profile_id: row.profile_id,
        reps: Number(row.reps),
        weight: row.weight,
        weight_unit: row.weight_unit,
        side: row.side,
      });
    }

    // Group exercise sequences by workout, preserving the SQL row order (Map
    // insertion order = most-recent-workout-first, then exercise first-appearance).
    const sequenceMap = new Map<string, { title: string | null; exercise_ids: string[] }>();
    for (const row of sequenceRows) {
      const entry = sequenceMap.get(row.workout_id);
      if (entry) {
        entry.exercise_ids.push(row.exercise_id);
      } else {
        sequenceMap.set(row.workout_id, {
          title: row.workout_name,
          exercise_ids: [row.exercise_id],
        });
      }
    }
    const exerciseSequences = [...sequenceMap.values()];

    return {
      gyms,
      profiles,
      gym_profile_mappings: gymProfileMappings,
      previous_sets: previousSets,
      exercise_sequences: exerciseSequences,
      // Only the account enrolled in gym check-ins (routes/gate.ts) gets its id here.
      gym_checkins_user_id: userId === gateUserId() ? userId : null,
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
        // 1. Create the workout. A retry after a lost response (even one racing
        // the first) must not create a second copy: the phone's id is unique
        // per user, and gym check-ins match on it. The conflict is resolved by
        // the database, so the loser waits for the winner and inserts nothing.
        const insert = tx.insert(workouts).values({
          userId,
          name: body.name,
          startTime: new Date(body.start_time),
          endTime: new Date(body.end_time),
          privacy: body.privacy ?? "friends",
          gymLocation: body.gym_location,
          kind: body.kind ?? "workout",
          clientId: body.client_id,
        });
        const [workout] = await (
          body.client_id
            ? insert.onConflictDoNothing({
                target: [workouts.userId, workouts.clientId],
                where: dsql`client_id IS NOT NULL`,
              })
            : insert
        ).returning({ id: workouts.id });
        if (!workout) return null;

        // 2. Insert all sets. `position` is the exercise's index in the
        // submitted order so exercise order is preserved independently of
        // createdAt (and survives later edits/reorders).
        for (const [position, exercise] of body.exercises.entries()) {
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
              position,
              createdAt: s.created_at ? new Date(s.created_at) : new Date(),
            });
          }
        }

        return workout.id;
      });

      if (workoutId === null) {
        const [existing] = await sql`
          SELECT id FROM workouts WHERE user_id = ${userId} AND client_id = ${body.client_id!} LIMIT 1
        `;
        return { workout_id: existing.id as string, previous_sets: {} };
      }

      // Fetch updated previous_sets for exercises in this workout
      const exerciseIds = body.exercises.map((e) => e.exercise_id);

      const previousSetsRows =
        exerciseIds.length === 0
          ? []
          : await sql`
        WITH ranked_sets AS (
            SELECT s.exercise_id, s.profile_id, s.reps, s.weight, s.weight_unit, s.side, s.created_at,
                DENSE_RANK() OVER (
                    PARTITION BY s.exercise_id, s.profile_id, (s.side IS NOT NULL)
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
          reps: Number(row.reps),
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
        client_id: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
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
