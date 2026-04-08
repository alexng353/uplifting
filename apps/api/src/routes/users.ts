import { Elysia, t } from "elysia";
import { eq, ilike, ne, and, sql } from "drizzle-orm";
import { db } from "../db";
import { users, userSettings } from "../db/schema";
import { authPlugin } from "../lib/auth";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authPlugin)

  // GET /me — current user profile
  .get("/me", async ({ userId }) => {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        real_name: users.realName,
        email: users.email,
        avatar_url: users.avatarUrl,
        email_verified: users.emailVerified,
        is_admin: users.isAdmin,
        created_at: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user;
  })

  // PUT /me — update current user profile
  .put(
    "/me",
    async ({ userId, body }) => {
      const updates: Record<string, unknown> = {};
      if (body.username !== undefined) updates.username = body.username;
      if (body.real_name !== undefined) updates.realName = body.real_name;
      if (body.avatar_url !== undefined) updates.avatarUrl = body.avatar_url;

      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          real_name: users.realName,
          email: users.email,
          avatar_url: users.avatarUrl,
          email_verified: users.emailVerified,
          is_admin: users.isAdmin,
          created_at: users.createdAt,
        });

      return updated;
    },
    {
      body: t.Object({
        username: t.Optional(t.String()),
        real_name: t.Optional(t.String()),
        avatar_url: t.Optional(t.String()),
      }),
    },
  )

  // DELETE /me — delete current user
  .delete("/me", async ({ userId }) => {
    await db.delete(users).where(eq(users.id, userId));
    return "deleted";
  })

  // GET /settings — user settings (creates defaults if missing)
  .get("/settings", async ({ userId }) => {
    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existing) return existing;

    const [created] = await db
      .insert(userSettings)
      .values({ userId })
      .returning();

    return created;
  })

  // PUT /settings — upsert user settings
  .put(
    "/settings",
    async ({ userId, body }) => {
      const values: Record<string, unknown> = { userId };
      const set: Record<string, unknown> = {};

      if (body.display_unit !== undefined) {
        values.displayUnit = body.display_unit;
        set.displayUnit = body.display_unit;
      }
      if (body.max_workout_duration_minutes !== undefined) {
        values.maxWorkoutDurationMinutes = body.max_workout_duration_minutes;
        set.maxWorkoutDurationMinutes = body.max_workout_duration_minutes;
      }
      if (body.default_rest_timer_seconds !== undefined) {
        values.defaultRestTimerSeconds = body.default_rest_timer_seconds;
        set.defaultRestTimerSeconds = body.default_rest_timer_seconds;
      }
      if (body.default_privacy !== undefined) {
        values.defaultPrivacy = body.default_privacy;
        set.defaultPrivacy = body.default_privacy;
      }
      if (body.share_gym_location !== undefined) {
        values.shareGymLocation = body.share_gym_location;
        set.shareGymLocation = body.share_gym_location;
      }
      if (body.share_online_status !== undefined) {
        values.shareOnlineStatus = body.share_online_status;
        set.shareOnlineStatus = body.share_online_status;
      }
      if (body.share_workout_status !== undefined) {
        values.shareWorkoutStatus = body.share_workout_status;
        set.shareWorkoutStatus = body.share_workout_status;
      }
      if (body.share_workout_history !== undefined) {
        values.shareWorkoutHistory = body.share_workout_history;
        set.shareWorkoutHistory = body.share_workout_history;
      }
      if (body.current_gym_id !== undefined) {
        values.currentGymId = body.current_gym_id;
        set.currentGymId = body.current_gym_id;
      }

      const [result] = await db
        .insert(userSettings)
        .values(values as typeof userSettings.$inferInsert)
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: set as Partial<typeof userSettings.$inferInsert>,
        })
        .returning();

      return result;
    },
    {
      body: t.Object({
        display_unit: t.Optional(t.String()),
        max_workout_duration_minutes: t.Optional(t.Number()),
        default_rest_timer_seconds: t.Optional(t.Number()),
        default_privacy: t.Optional(t.String()),
        share_gym_location: t.Optional(t.Boolean()),
        share_online_status: t.Optional(t.Boolean()),
        share_workout_status: t.Optional(t.Boolean()),
        share_workout_history: t.Optional(t.Boolean()),
        current_gym_id: t.Optional(t.String()),
      }),
    },
  )

  // GET /search — search users by username
  .get(
    "/search",
    async ({ userId, query }) => {
      const results = await db
        .select({
          id: users.id,
          username: users.username,
          real_name: users.realName,
          avatar_url: users.avatarUrl,
        })
        .from(users)
        .where(
          and(
            ne(users.id, userId),
            ilike(users.username, `%${query.q}%`),
          ),
        )
        .limit(20);

      return results;
    },
    {
      query: t.Object({
        q: t.String(),
      }),
    },
  );
