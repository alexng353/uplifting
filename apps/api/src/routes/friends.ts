import { Elysia, t } from "elysia";
import { db, sql } from "../db";
import { friendships } from "../db/schema";
import { eq, and, or } from "drizzle-orm";
import { authPlugin } from "../lib/auth";

export const friendRoutes = new Elysia({ prefix: "/friends" })
  .use(authPlugin)

  // POST / — send friend request
  .post(
    "/",
    async ({ userId, body, set }) => {
      if (userId === body.friend_id) {
        set.status = 400;
        return { error: "Cannot friend yourself" };
      }

      // Check no existing relationship in either direction
      const existing = await sql`
        SELECT id FROM friendships
        WHERE (user_id = ${userId} AND friend_id = ${body.friend_id})
           OR (user_id = ${body.friend_id} AND friend_id = ${userId})
        LIMIT 1
      `;

      if (existing.length) {
        set.status = 409;
        return { error: "Friendship already exists" };
      }

      const [friendship] = await db
        .insert(friendships)
        .values({
          userId,
          friendId: body.friend_id,
          status: "pending",
        })
        .returning();

      return friendship;
    },
    {
      body: t.Object({
        friend_id: t.String(),
      }),
    },
  )

  // GET / — list accepted friends with online/workout status
  .get("/", async ({ userId }) => {
    const rows = await sql`
      SELECT f.id as friendship_id, u.id as user_id, u.username, u.real_name, u.avatar_url,
          f.status, f.created_at,
          ua.last_seen_at, ua.current_workout_started_at, w.name as current_workout_name,
          us.share_online_status, us.share_workout_status, us.max_workout_duration_minutes
      FROM friendships f
      JOIN users u ON u.id = f.friend_id
      LEFT JOIN user_activity ua ON ua.user_id = u.id
      LEFT JOIN user_settings us ON us.user_id = u.id
      LEFT JOIN workouts w ON w.id = ua.current_workout_id
      WHERE f.user_id = ${userId} AND f.status = 'accepted'
      UNION ALL
      SELECT f.id, u.id, u.username, u.real_name, u.avatar_url,
          f.status, f.created_at,
          ua.last_seen_at, ua.current_workout_started_at, w.name,
          us.share_online_status, us.share_workout_status, us.max_workout_duration_minutes
      FROM friendships f
      JOIN users u ON u.id = f.user_id
      LEFT JOIN user_activity ua ON ua.user_id = u.id
      LEFT JOIN user_settings us ON us.user_id = u.id
      LEFT JOIN workouts w ON w.id = ua.current_workout_id
      WHERE f.friend_id = ${userId} AND f.status = 'accepted'
      ORDER BY created_at DESC
    `;

    const now = Date.now();

    return rows.map((r) => {
      const lastSeen = r.last_seen_at ? new Date(r.last_seen_at as string).getTime() : 0;
      const workoutStarted = r.current_workout_started_at
        ? new Date(r.current_workout_started_at as string).getTime()
        : 0;
      const maxDuration = Number(r.max_workout_duration_minutes ?? 120);

      const isOnline =
        r.share_online_status && lastSeen > 0 && now - lastSeen < 5 * 60 * 1000;
      const isInWorkout =
        r.share_workout_status &&
        workoutStarted > 0 &&
        now - workoutStarted < maxDuration * 60 * 1000;

      return {
        friendship_id: r.friendship_id,
        user_id: r.user_id,
        username: r.username,
        real_name: r.real_name,
        avatar_url: r.avatar_url,
        status: r.status,
        created_at: r.created_at,
        is_online: isOnline,
        is_in_workout: isInWorkout,
        current_workout_name: isInWorkout ? r.current_workout_name : null,
      };
    });
  })

  // GET /requests — pending requests sent TO this user
  .get("/requests", async ({ userId }) => {
    const rows = await sql`
      SELECT f.id as friendship_id, u.id as user_id, u.username, u.real_name, u.avatar_url,
          f.status, f.created_at
      FROM friendships f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ${userId} AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `;

    return rows;
  })

  // PUT /respond/:friendshipId — accept, decline, or block
  .put(
    "/respond/:friendshipId",
    async ({ userId, params, body, set }) => {
      // Verify the friendship is pending and user is the recipient
      const [friendship] = await sql`
        SELECT id, user_id, friend_id, status FROM friendships
        WHERE id = ${params.friendshipId}
        LIMIT 1
      `;

      if (!friendship) {
        set.status = 404;
        return { error: "Friendship not found" };
      }

      if (friendship.friend_id !== userId) {
        set.status = 403;
        return { error: "Not the recipient of this request" };
      }

      if (friendship.status !== "pending") {
        set.status = 400;
        return { error: "Friendship is not pending" };
      }

      if (body.action === "decline") {
        await sql`DELETE FROM friendships WHERE id = ${params.friendshipId}`;
        return "declined";
      }

      if (body.action === "accept" || body.action === "block") {
        const [updated] = await sql`
          UPDATE friendships SET status = ${body.action === "accept" ? "accepted" : "blocked"}
          WHERE id = ${params.friendshipId}
          RETURNING *
        `;
        return updated;
      }

      set.status = 400;
      return { error: "Invalid action" };
    },
    {
      body: t.Object({
        action: t.String(),
      }),
    },
  )

  // DELETE /:friendshipId — remove friendship
  .delete("/:friendshipId", async ({ userId, params, set }) => {
    const [friendship] = await sql`
      SELECT id, user_id, friend_id FROM friendships
      WHERE id = ${params.friendshipId}
      LIMIT 1
    `;

    if (!friendship) {
      set.status = 404;
      return { error: "Friendship not found" };
    }

    if (friendship.user_id !== userId && friendship.friend_id !== userId) {
      set.status = 403;
      return { error: "Not part of this friendship" };
    }

    await sql`DELETE FROM friendships WHERE id = ${params.friendshipId}`;

    return "deleted";
  })

  // GET /feed — friends' completed workouts
  .get(
    "/feed",
    async ({ userId, query }) => {
      const limit = Number(query.limit ?? 20);
      const offset = Number(query.offset ?? 0);

      const rows = await sql`
        SELECT w.id as workout_id, u.id as user_id, u.username, u.real_name, u.avatar_url,
            w.name as workout_name, w.start_time, w.end_time,
            EXTRACT(EPOCH FROM (COALESCE(w.end_time, NOW()) - w.start_time))::bigint / 60 as duration_minutes,
            (SELECT SUM(s.weight * s.reps) FROM user_sets s WHERE s.workout_id = w.id) as total_volume,
            (SELECT COUNT(*) FILTER (WHERE s.side IS NULL OR s.side = 'R') FROM user_sets s WHERE s.workout_id = w.id) as total_sets,
            w.gym_location
        FROM workouts w JOIN users u ON u.id = w.user_id
        WHERE w.privacy = 'friends' AND w.end_time IS NOT NULL
          AND (EXISTS (SELECT 1 FROM friendships f WHERE f.user_id = ${userId} AND f.friend_id = w.user_id AND f.status = 'accepted')
            OR EXISTS (SELECT 1 FROM friendships f WHERE f.friend_id = ${userId} AND f.user_id = w.user_id AND f.status = 'accepted'))
        ORDER BY w.end_time DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return rows.map((r) => ({
        workout_id: r.workout_id,
        user_id: r.user_id,
        username: r.username,
        real_name: r.real_name,
        avatar_url: r.avatar_url,
        workout_name: r.workout_name,
        start_time: r.start_time,
        end_time: r.end_time,
        duration_minutes: Number(r.duration_minutes ?? 0),
        total_volume: Number(r.total_volume ?? 0),
        total_sets: Number(r.total_sets ?? 0),
        gym_location: r.gym_location,
      }));
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    },
  )

  // POST /activity — update user activity (heartbeat)
  .post(
    "/activity",
    async ({ userId, body }) => {
      let workoutStartedAt: Date | null = null;

      if (body.current_workout_id) {
        const [workout] = await sql`
          SELECT start_time FROM workouts WHERE id = ${body.current_workout_id} AND user_id = ${userId}
        `;
        if (workout) {
          workoutStartedAt = new Date(workout.start_time as string);
        }
      }

      await sql`
        INSERT INTO user_activity (user_id, last_seen_at, current_workout_id, current_workout_started_at)
        VALUES (${userId}, NOW(), ${body.current_workout_id ?? null}, ${workoutStartedAt})
        ON CONFLICT (user_id) DO UPDATE SET
          last_seen_at = NOW(),
          current_workout_id = ${body.current_workout_id ?? null},
          current_workout_started_at = ${workoutStartedAt}
      `;

      return {};
    },
    {
      body: t.Object({
        current_workout_id: t.Optional(t.String()),
      }),
    },
  )

  // GET /workouts/:friendId — friend's workout history
  .get(
    "/workouts/:friendId",
    async ({ userId, params, query, set }) => {
      const limit = Number(query.limit ?? 20);
      const offset = Number(query.offset ?? 0);

      // Check friendship exists and is accepted
      const [friendship] = await sql`
        SELECT id FROM friendships
        WHERE ((user_id = ${userId} AND friend_id = ${params.friendId})
            OR (friend_id = ${userId} AND user_id = ${params.friendId}))
          AND status = 'accepted'
        LIMIT 1
      `;

      if (!friendship) {
        set.status = 403;
        return { error: "Not friends" };
      }

      // Check friend's share_workout_history setting
      const [settings] = await sql`
        SELECT share_workout_history FROM user_settings WHERE user_id = ${params.friendId}
      `;

      if (settings && !settings.share_workout_history) {
        set.status = 403;
        return { error: "Friend has disabled workout history sharing" };
      }

      // Friend profile
      const [friend] = await sql`
        SELECT id, username, real_name, avatar_url FROM users WHERE id = ${params.friendId}
      `;

      if (!friend) {
        set.status = 404;
        return { error: "User not found" };
      }

      // Week stats (current week: Monday-Sunday)
      const [weekStats] = await sql`
        SELECT
          COUNT(DISTINCT w.id) as workout_count,
          COALESCE(SUM(s.weight * s.reps), 0) as total_volume,
          COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(w.end_time, NOW()) - w.start_time)) / 60), 0)::bigint as total_duration_minutes
        FROM workouts w
        LEFT JOIN user_sets s ON s.workout_id = w.id
        WHERE w.user_id = ${params.friendId}
          AND w.kind = 'workout'
          AND w.start_time >= date_trunc('week', CURRENT_DATE)
      `;

      // Paginated workouts
      const [countResult, workoutRows] = await Promise.all([
        sql`
          SELECT COUNT(*)::int as total FROM workouts
          WHERE user_id = ${params.friendId}
            AND privacy IN ('friends', 'public')
            AND end_time IS NOT NULL
            AND kind = 'workout'
        `,
        sql`
          SELECT id, name, start_time, end_time, gym_location,
            EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))::bigint / 60 as duration_minutes,
            (SELECT SUM(s.weight * s.reps) FROM user_sets s WHERE s.workout_id = w.id) as total_volume,
            (SELECT COUNT(*) FILTER (WHERE s.side IS NULL OR s.side = 'R') FROM user_sets s WHERE s.workout_id = w.id) as total_sets
          FROM workouts w
          WHERE user_id = ${params.friendId}
            AND privacy IN ('friends', 'public')
            AND end_time IS NOT NULL
            AND kind = 'workout'
          ORDER BY end_time DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
      ]);

      return {
        friend: {
          id: friend.id,
          username: friend.username,
          real_name: friend.real_name,
          avatar_url: friend.avatar_url,
        },
        week_stats: {
          workout_count: Number(weekStats?.workout_count ?? 0),
          total_volume: Number(weekStats?.total_volume ?? 0),
          total_duration_minutes: Number(weekStats?.total_duration_minutes ?? 0),
        },
        workouts: workoutRows.map((w) => ({
          id: w.id,
          name: w.name,
          start_time: w.start_time,
          end_time: w.end_time,
          gym_location: w.gym_location,
          duration_minutes: Number(w.duration_minutes ?? 0),
          total_volume: Number(w.total_volume ?? 0),
          total_sets: Number(w.total_sets ?? 0),
        })),
        total: Number(countResult[0]?.total ?? 0),
      };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    },
  );
