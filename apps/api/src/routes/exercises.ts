import { Elysia, t } from "elysia";
import { eq, and } from "drizzle-orm";
import { db, sql } from "../db";
import {
  exercises,
  exerciseMuscleRelations,
  exerciseProfiles,
  favouriteExercises,
  muscles,
} from "../db/schema";
import { authPlugin } from "../lib/auth";

const EXERCISE_TYPES = [
  "dumbbell",
  "barbell",
  "bodyweight",
  "machine",
  "kettlebell",
  "resistance_band",
  "cable",
  "medicine_ball",
  "plyometric",
  "plate_loaded_machine",
];

export const exerciseRoutes = new Elysia({ prefix: "/exercises" })
  .use(authPlugin)

  // GET /types — all exercise type values
  .get("/types", () => {
    return EXERCISE_TYPES;
  })

  // GET /used — exercises the user has actually used
  .get(
    "/used",
    async ({ userId, query }) => {
      const limit = Number(query.limit ?? 20);
      const offset = Number(query.offset ?? 0);

      const rows = await sql`
        SELECT e.id, e.name, COUNT(DISTINCT s.workout_id) as workout_count,
          COUNT(s.id) FILTER (WHERE s.side IS NULL OR s.side = 'R') as total_sets,
          COALESCE(SUM(s.weight * s.reps), 0) as total_volume
        FROM user_sets s JOIN exercises e ON e.id = s.exercise_id
        WHERE s.user_id = ${userId}
        GROUP BY e.id, e.name ORDER BY COUNT(DISTINCT s.workout_id) DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        workout_count: Number(r.workout_count),
        total_sets: Number(r.total_sets),
        total_volume: Number(r.total_volume),
      }));
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    },
  )

  // GET /favourites — exercise UUIDs the user has favourited
  .get("/favourites", async ({ userId }) => {
    const rows = await sql`
      SELECT exercise_id FROM favourite_exercises WHERE user_id = ${userId}
    `;
    return rows.map((r) => r.exercise_id);
  })

  // GET /profiles — all exercise profiles for the user
  .get("/profiles", async ({ userId }) => {
    const rows = await db
      .select()
      .from(exerciseProfiles)
      .where(eq(exerciseProfiles.userId, userId))
      .orderBy(exerciseProfiles.exerciseId, exerciseProfiles.name);

    return rows;
  })

  // GET / — list exercises with optional filters
  .get(
    "/",
    async ({ userId, query }) => {
      const limit = Number(query.limit ?? 50);
      const offset = Number(query.offset ?? 0);

      // Build dynamic WHERE conditions and params
      const conditions: string[] = ["(e.official = true OR e.author_id = $1)"];
      const params: unknown[] = [userId];
      let paramIdx = 2;

      let joinMuscle = false;

      if (query.exercise_type) {
        conditions.push(`e.exercise_type = $${paramIdx}`);
        params.push(query.exercise_type);
        paramIdx++;
      }

      if (query.muscle) {
        joinMuscle = true;
        conditions.push(`LOWER(m.name) = LOWER($${paramIdx})`);
        params.push(query.muscle);
        paramIdx++;
      }

      if (query.muscle_group) {
        joinMuscle = true;
        conditions.push(
          `(LOWER(m.major_group) = LOWER($${paramIdx}) OR LOWER(m.minor_group) = LOWER($${paramIdx}))`,
        );
        params.push(query.muscle_group);
        paramIdx++;
      }

      if (query.search) {
        conditions.push(`LOWER(e.name) LIKE LOWER($${paramIdx})`);
        params.push(`%${query.search}%`);
        paramIdx++;
      }

      const joinClause = joinMuscle
        ? `JOIN exercise_muscle_relations emr ON emr.exercise_id = e.id
           JOIN muscles m ON m.id = emr.muscle_id`
        : "";

      const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      params.push(limit);
      const limitIdx = paramIdx;
      paramIdx++;
      params.push(offset);
      const offsetIdx = paramIdx;

      const queryText = `
        SELECT DISTINCT e.id, e.name, e.exercise_type, e.official, e.author_id, e.description, e.created_at,
          COALESCE(
            (SELECT array_agg(m2.name) FROM exercise_muscle_relations emr2
             JOIN muscles m2 ON m2.id = emr2.muscle_id
             WHERE emr2.exercise_id = e.id AND emr2.is_primary = true),
            '{}'
          ) as primary_muscles,
          COALESCE(
            (SELECT array_agg(m3.name) FROM exercise_muscle_relations emr3
             JOIN muscles m3 ON m3.id = emr3.muscle_id
             WHERE emr3.exercise_id = e.id AND emr3.is_primary = false),
            '{}'
          ) as secondary_muscles
        FROM exercises e
        ${joinClause}
        ${whereClause}
        ORDER BY e.name ASC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const rows = await sql.unsafe(queryText, params as any[]);

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        exercise_type: r.exercise_type,
        official: r.official,
        author_id: r.author_id,
        description: r.description,
        created_at: r.created_at,
        primary_muscles: r.primary_muscles ?? [],
        secondary_muscles: r.secondary_muscles ?? [],
      }));
    },
    {
      query: t.Object({
        exercise_type: t.Optional(t.String()),
        muscle: t.Optional(t.String()),
        muscle_group: t.Optional(t.String()),
        search: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    },
  )

  // POST / — create exercise (admin only)
  .post(
    "/",
    async ({ userId, user, body, set }) => {
      if (!user.isAdmin) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      const result = await db.transaction(async (tx) => {
        const [exercise] = await tx
          .insert(exercises)
          .values({
            name: body.name,
            exerciseType: body.exercise_type as any,
            official: true,
            authorId: userId,
            description: body.description,
          })
          .returning({ id: exercises.id });

        // Insert primary muscle relations
        if (body.primary_muscles?.length) {
          for (const muscleName of body.primary_muscles) {
            const [muscle] = await tx
              .select({ id: muscles.id })
              .from(muscles)
              .where(eq(muscles.name, muscleName))
              .limit(1);

            if (muscle) {
              await tx.insert(exerciseMuscleRelations).values({
                exerciseId: exercise.id,
                muscleId: muscle.id,
                isPrimary: true,
              });
            }
          }
        }

        // Insert secondary muscle relations
        if (body.secondary_muscles?.length) {
          for (const muscleName of body.secondary_muscles) {
            const [muscle] = await tx
              .select({ id: muscles.id })
              .from(muscles)
              .where(eq(muscles.name, muscleName))
              .limit(1);

            if (muscle) {
              await tx.insert(exerciseMuscleRelations).values({
                exerciseId: exercise.id,
                muscleId: muscle.id,
                isPrimary: false,
              });
            }
          }
        }

        return exercise;
      });

      return { id: result.id };
    },
    {
      body: t.Object({
        name: t.String(),
        exercise_type: t.String(),
        description: t.Optional(t.String()),
        primary_muscles: t.Optional(t.Array(t.String())),
        secondary_muscles: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // GET /:exerciseId — exercise details
  .get("/:exerciseId", async ({ userId, params, set }) => {
    const [exercise, primaryMuscles, secondaryMuscles, favourite, pr] =
      await Promise.all([
        // 1. Exercise
        sql`SELECT * FROM exercises WHERE id = ${params.exerciseId}`,
        // 2. Primary muscles
        sql`
          SELECT m.name FROM muscles m
          JOIN exercise_muscle_relations emr ON emr.muscle_id = m.id
          WHERE emr.exercise_id = ${params.exerciseId} AND emr.is_primary = true
        `,
        // 3. Secondary muscles
        sql`
          SELECT m.name FROM muscles m
          JOIN exercise_muscle_relations emr ON emr.muscle_id = m.id
          WHERE emr.exercise_id = ${params.exerciseId} AND emr.is_primary = false
        `,
        // 4. Is favourite
        sql`
          SELECT id FROM favourite_exercises
          WHERE user_id = ${userId} AND exercise_id = ${params.exerciseId}
        `,
        // 5. Personal record
        sql`
          SELECT weight, weight_unit, reps, created_at FROM user_sets
          WHERE user_id = ${userId} AND exercise_id = ${params.exerciseId}
          ORDER BY weight DESC, reps DESC LIMIT 1
        `,
      ]);

    if (!exercise.length) {
      set.status = 404;
      return { error: "Exercise not found" };
    }

    const e = exercise[0];
    return {
      id: e.id,
      name: e.name,
      exercise_type: e.exercise_type,
      official: e.official,
      author_id: e.author_id,
      description: e.description,
      created_at: e.created_at,
      primary_muscles: primaryMuscles.map((m) => m.name),
      secondary_muscles: secondaryMuscles.map((m) => m.name),
      is_favourite: favourite.length > 0,
      personal_record: pr.length
        ? {
            weight: Number(pr[0].weight),
            weight_unit: pr[0].weight_unit,
            reps: pr[0].reps,
            created_at: pr[0].created_at,
          }
        : null,
    };
  })

  // GET /:exerciseId/history — exercise history grouped by workout
  .get(
    "/:exerciseId/history",
    async ({ userId, params, query }) => {
      const profileId = query.profile_id ?? null;
      const monthsBack = query.months ? Number(query.months) : null;
      const sinceDate = monthsBack
        ? new Date(
            Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000,
          ).toISOString()
        : null;

      const rows = await sql`
        SELECT s.reps, s.weight, s.weight_unit, s.side, s.workout_id, w.start_time
        FROM user_sets s JOIN workouts w ON w.id = s.workout_id
        WHERE s.user_id = ${userId} AND s.exercise_id = ${params.exerciseId}
          AND (${profileId}::uuid IS NULL OR s.profile_id = ${profileId}::uuid)
          AND (${sinceDate}::timestamptz IS NULL OR w.start_time >= ${sinceDate}::timestamptz)
        ORDER BY w.start_time ASC, s.created_at ASC
      `;

      // Group by workout_id
      const workoutMap = new Map<
        string,
        {
          date: string;
          workout_id: string;
          sets: { reps: number; weight: number; weight_unit: string; side: string | null }[];
        }
      >();

      for (const r of rows) {
        const wid = r.workout_id as string;
        if (!workoutMap.has(wid)) {
          workoutMap.set(wid, {
            date: r.start_time as string,
            workout_id: wid,
            sets: [],
          });
        }
        workoutMap.get(wid)!.sets.push({
          reps: r.reps as number,
          weight: Number(r.weight),
          weight_unit: r.weight_unit as string,
          side: r.side as string | null,
        });
      }

      return {
        exercise_id: params.exerciseId,
        profile_id: profileId,
        history: Array.from(workoutMap.values()),
      };
    },
    {
      query: t.Object({
        months: t.Optional(t.String()),
        profile_id: t.Optional(t.String()),
      }),
    },
  )

  // GET /:exerciseId/profiles — profiles for a specific exercise
  .get("/:exerciseId/profiles", async ({ userId, params }) => {
    const rows = await db
      .select()
      .from(exerciseProfiles)
      .where(
        and(
          eq(exerciseProfiles.userId, userId),
          eq(exerciseProfiles.exerciseId, params.exerciseId),
        ),
      )
      .orderBy(exerciseProfiles.name);

    return rows;
  })

  // POST /:exerciseId/profiles — create a profile
  .post(
    "/:exerciseId/profiles",
    async ({ userId, params, body }) => {
      const [profile] = await db
        .insert(exerciseProfiles)
        .values({
          userId,
          exerciseId: params.exerciseId,
          name: body.name,
        })
        .returning();

      return profile;
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  )

  // PUT /:exerciseId/profiles/:profileId — update a profile
  .put(
    "/:exerciseId/profiles/:profileId",
    async ({ userId, params, body, set }) => {
      // Verify ownership
      const [existing] = await db
        .select()
        .from(exerciseProfiles)
        .where(
          and(
            eq(exerciseProfiles.id, params.profileId),
            eq(exerciseProfiles.userId, userId),
          ),
        )
        .limit(1);

      if (!existing) {
        set.status = 404;
        return { error: "Profile not found" };
      }

      const [updated] = await db
        .update(exerciseProfiles)
        .set({ name: body.name })
        .where(eq(exerciseProfiles.id, params.profileId))
        .returning();

      return updated;
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  )

  // POST /:exerciseId/favourite — add to favourites
  .post("/:exerciseId/favourite", async ({ userId, params }) => {
    await sql`
      INSERT INTO favourite_exercises (user_id, exercise_id)
      VALUES (${userId}, ${params.exerciseId})
      ON CONFLICT DO NOTHING
    `;
    return "added";
  })

  // DELETE /:exerciseId/favourite — remove from favourites
  .delete("/:exerciseId/favourite", async ({ userId, params }) => {
    await sql`
      DELETE FROM favourite_exercises
      WHERE user_id = ${userId} AND exercise_id = ${params.exerciseId}
    `;
    return "removed";
  });
