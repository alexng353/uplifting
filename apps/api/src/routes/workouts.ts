import { Elysia, t } from "elysia";
import { eq, and, desc, sql as dsql, asc } from "drizzle-orm";
import { db, sql } from "../db";
import { workouts, userSets } from "../db/schema";
import { authPlugin } from "../lib/auth";

export const workoutRoutes = new Elysia({ prefix: "/workouts" })
  .use(authPlugin)

  // POST / — create a new workout
  .post(
    "/",
    async ({ userId, body }) => {
      const [workout] = await db
        .insert(workouts)
        .values({
          userId,
          name: body.name,
          privacy: body.privacy ?? "friends",
          gymLocation: body.gym_location,
          kind: body.kind ?? "workout",
          startTime: new Date(),
        })
        .returning();

      return workout;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        privacy: t.Optional(t.String()),
        gym_location: t.Optional(t.String()),
        kind: t.Optional(t.String()),
      }),
    },
  )

  // GET /streak — current consecutive workout days
  .get("/streak", async ({ userId }) => {
    const result = await sql`
      WITH workout_dates AS (
        SELECT DISTINCT (start_time AT TIME ZONE 'UTC')::date AS d
        FROM workouts
        WHERE user_id = ${userId}
      ),
      numbered AS (
        SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d ASC))::int AS grp
        FROM workout_dates
      )
      SELECT COALESCE(COUNT(*)::bigint, 0) as current_streak
      FROM numbered
      WHERE grp = (
        SELECT grp FROM numbered
        WHERE d >= CURRENT_DATE - 1
        ORDER BY d DESC
        LIMIT 1
      )
    `;

    return {
      current_streak: Number(result[0]?.current_streak ?? 0),
    };
  })

  // GET /all-time-stats — aggregate stats across all workouts
  .get("/all-time-stats", async ({ userId }) => {
    const [totals, timeResult, streakResult, topExercises, muscleVolume] =
      await Promise.all([
        // Query 1 — Total stats
        sql`
          SELECT
            COUNT(DISTINCT w.id) as total_workouts,
            COALESCE(SUM(s.weight * s.reps), 0) as total_volume,
            COUNT(s.id) FILTER (WHERE s.side IS NULL OR s.side = 'R') as total_sets,
            COALESCE(SUM(s.reps), 0) as total_reps
          FROM workouts w
          LEFT JOIN user_sets s ON s.workout_id = w.id
          WHERE w.user_id = ${userId} AND w.kind = 'workout'
        `,
        // Query 2 — Total time
        sql`
          SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time)) / 60), 0)::bigint as total_time_minutes
          FROM workouts
          WHERE user_id = ${userId} AND kind = 'workout'
        `,
        // Query 3 — Best streak
        sql`
          WITH workout_dates AS (
            SELECT DISTINCT (start_time AT TIME ZONE 'UTC')::date AS d
            FROM workouts WHERE user_id = ${userId}
          ),
          numbered AS (
            SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS grp
            FROM workout_dates
          )
          SELECT COALESCE(MAX(cnt), 0)::bigint as best_streak
          FROM (SELECT COUNT(*) as cnt FROM numbered GROUP BY grp) sub
        `,
        // Query 4 — Top exercises (limit 10)
        sql`
          SELECT
            e.id, e.name,
            COUNT(DISTINCT s.workout_id) as workout_count,
            COUNT(s.id) FILTER (WHERE s.side IS NULL OR s.side = 'R') as total_sets,
            COALESCE(SUM(s.weight * s.reps), 0) as total_volume
          FROM user_sets s
          JOIN exercises e ON e.id = s.exercise_id
          WHERE s.user_id = ${userId}
          GROUP BY e.id, e.name
          ORDER BY COUNT(DISTINCT s.workout_id) DESC
          LIMIT 10
        `,
        // Query 5 — Muscle group volume
        sql`
          SELECT
            COALESCE(m.major_group, 'Other') as "group",
            COALESCE(SUM(s.weight * s.reps), 0) as volume
          FROM user_sets s
          JOIN exercise_muscle_relations emr ON emr.exercise_id = s.exercise_id AND emr.is_primary = true
          JOIN muscles m ON m.id = emr.muscle_id
          WHERE s.user_id = ${userId}
          GROUP BY m.major_group
        `,
      ]);

    const maxVolume = Math.max(
      ...muscleVolume.map((r) => Number(r.volume)),
      1,
    );
    const muscleGroupVolumeList = muscleVolume.map((row) => ({
      group: row.group as string,
      volume: Number(row.volume),
      percentage: Math.round((Number(row.volume) / maxVolume) * 100),
    }));

    return {
      total_workouts: Number(totals[0]?.total_workouts ?? 0),
      total_volume: Number(totals[0]?.total_volume ?? 0),
      total_time_minutes: Number(timeResult[0]?.total_time_minutes ?? 0),
      total_sets: Number(totals[0]?.total_sets ?? 0),
      total_reps: Number(totals[0]?.total_reps ?? 0),
      best_streak: Number(streakResult[0]?.best_streak ?? 0),
      top_exercises: topExercises.map((e) => ({
        id: e.id,
        name: e.name,
        workout_count: Number(e.workout_count),
        total_sets: Number(e.total_sets),
        total_volume: Number(e.total_volume),
      })),
      muscle_group_volume: muscleGroupVolumeList,
    };
  })

  // GET / — list user's workouts with pagination
  .get(
    "/",
    async ({ userId, query }) => {
      const page = Number(query.page ?? 1);
      const perPage = Number(query.per_page ?? 20);
      const offset = (page - 1) * perPage;

      const [countResult, workoutList] = await Promise.all([
        db
          .select({ count: dsql<number>`count(*)::int` })
          .from(workouts)
          .where(eq(workouts.userId, userId)),
        db
          .select()
          .from(workouts)
          .where(eq(workouts.userId, userId))
          .orderBy(desc(workouts.startTime))
          .limit(perPage)
          .offset(offset),
      ]);

      return {
        workouts: workoutList,
        total: countResult[0]?.count ?? 0,
        page,
        per_page: perPage,
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        per_page: t.Optional(t.String()),
      }),
    },
  )

  // GET /:workoutId — single workout with grouped exercises
  .get("/:workoutId", async ({ userId, params, set }) => {
    const [workout] = await db
      .select()
      .from(workouts)
      .where(
        and(eq(workouts.id, params.workoutId), eq(workouts.userId, userId)),
      )
      .limit(1);

    if (!workout) {
      set.status = 404;
      return { error: "Workout not found" };
    }

    const sets = await db
      .select()
      .from(userSets)
      .where(eq(userSets.workoutId, params.workoutId))
      .orderBy(asc(userSets.createdAt));

    // Group sets by (exercise_id, profile_id)
    const groupMap = new Map<
      string,
      { exercise_id: string; profile_id: string | null; is_unilateral: boolean; sets: (typeof sets)[number][] }
    >();

    for (const s of sets) {
      const key = `${s.exerciseId}|${s.profileId ?? "null"}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          exercise_id: s.exerciseId,
          profile_id: s.profileId,
          is_unilateral: false,
          sets: [],
        });
      }
      const group = groupMap.get(key)!;
      if (s.side !== null) {
        group.is_unilateral = true;
      }
      group.sets.push(s);
    }

    return {
      ...workout,
      exercises: Array.from(groupMap.values()),
    };
  })

  // GET /:workoutId/summary — workout summary with aggregate stats
  .get("/:workoutId/summary", async ({ userId, params, set }) => {
    // Verify ownership
    const [workout] = await db
      .select({ id: workouts.id })
      .from(workouts)
      .where(
        and(eq(workouts.id, params.workoutId), eq(workouts.userId, userId)),
      )
      .limit(1);

    if (!workout) {
      set.status = 404;
      return { error: "Workout not found" };
    }

    const result = await sql`
      SELECT
        w.id, w.name, w.start_time, w.end_time,
        COALESCE(EXTRACT(EPOCH FROM (COALESCE(w.end_time, NOW()) - w.start_time)) / 60, 0)::bigint as duration_minutes,
        COALESCE(SUM(s.weight * s.reps), 0) as total_volume,
        COUNT(s.id) FILTER (WHERE s.side IS NULL OR s.side = 'R') as total_sets,
        COALESCE(SUM(s.reps), 0) as total_reps,
        COUNT(DISTINCT s.exercise_id) as exercises_count
      FROM workouts w
      LEFT JOIN user_sets s ON s.workout_id = w.id
      WHERE w.id = ${params.workoutId}
      GROUP BY w.id
    `;

    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      start_time: new Date(row.start_time).toISOString(),
      end_time: row.end_time ? new Date(row.end_time).toISOString() : null,
      duration_minutes: Number(row.duration_minutes),
      total_volume: Number(row.total_volume),
      total_sets: Number(row.total_sets),
      total_reps: Number(row.total_reps),
      exercises_count: Number(row.exercises_count),
    };
  })

  // PUT /:workoutId — update a workout
  .put(
    "/:workoutId",
    async ({ userId, params, body, set }) => {
      // Verify ownership
      const [existing] = await db
        .select({ id: workouts.id })
        .from(workouts)
        .where(
          and(
            eq(workouts.id, params.workoutId),
            eq(workouts.userId, userId),
          ),
        )
        .limit(1);

      if (!existing) {
        set.status = 404;
        return { error: "Workout not found" };
      }

      if (body.exercises) {
        const result = await db.transaction(async (tx) => {
          // 1. Build and apply metadata updates
          const updates: Record<string, unknown> = {};
          if (body.name !== undefined) updates.name = body.name;
          if (body.privacy !== undefined) updates.privacy = body.privacy;
          if (body.gym_location !== undefined) updates.gymLocation = body.gym_location;
          if (body.start_time !== undefined) updates.startTime = new Date(body.start_time!);
          if (body.end_time !== undefined) updates.endTime = new Date(body.end_time!);

          let updated;
          if (Object.keys(updates).length > 0) {
            [updated] = await tx.update(workouts).set(updates).where(eq(workouts.id, params.workoutId)).returning();
          } else {
            [updated] = await tx.select().from(workouts).where(eq(workouts.id, params.workoutId)).limit(1);
          }

          // 2. Delete all existing sets
          await tx.delete(userSets).where(eq(userSets.workoutId, params.workoutId));

          // 3. Insert new sets
          for (const exercise of body.exercises!) {
            for (const s of exercise.sets) {
              await tx.insert(userSets).values({
                userId,
                workoutId: params.workoutId,
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

          return updated;
        });

        // Re-fetch sets and group them (same shape as GET /:workoutId)
        const sets = await db.select().from(userSets).where(eq(userSets.workoutId, params.workoutId)).orderBy(asc(userSets.createdAt));

        const groupMap = new Map<string, { exercise_id: string; profile_id: string | null; is_unilateral: boolean; sets: (typeof sets)[number][] }>();
        for (const s of sets) {
          const key = `${s.exerciseId}|${s.profileId ?? "null"}`;
          if (!groupMap.has(key)) {
            groupMap.set(key, { exercise_id: s.exerciseId, profile_id: s.profileId, is_unilateral: false, sets: [] });
          }
          const group = groupMap.get(key)!;
          if (s.side !== null) group.is_unilateral = true;
          group.sets.push(s);
        }

        return { ...result, exercises: Array.from(groupMap.values()) };
      }

      // Metadata-only update (original behavior)
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.privacy !== undefined) updates.privacy = body.privacy;
      if (body.gym_location !== undefined)
        updates.gymLocation = body.gym_location;
      if (body.start_time !== undefined)
        updates.startTime = new Date(body.start_time);
      if (body.end_time !== undefined)
        updates.endTime = new Date(body.end_time);

      const [updated] = await db
        .update(workouts)
        .set(updates)
        .where(eq(workouts.id, params.workoutId))
        .returning();

      return updated;
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        privacy: t.Optional(t.String()),
        gym_location: t.Optional(t.String()),
        start_time: t.Optional(t.String()),
        end_time: t.Optional(t.String()),
        exercises: t.Optional(
          t.Array(
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
        ),
      }),
    },
  )

  // DELETE /:workoutId — delete a workout and its sets
  .delete("/:workoutId", async ({ userId, params, set }) => {
    // Verify ownership
    const [existing] = await db
      .select({ id: workouts.id })
      .from(workouts)
      .where(
        and(
          eq(workouts.id, params.workoutId),
          eq(workouts.userId, userId),
        ),
      )
      .limit(1);

    if (!existing) {
      set.status = 404;
      return { error: "Workout not found" };
    }

    // Delete sets first, then workout
    await db
      .delete(userSets)
      .where(eq(userSets.workoutId, params.workoutId));
    await db.delete(workouts).where(eq(workouts.id, params.workoutId));

    return "deleted";
  });
