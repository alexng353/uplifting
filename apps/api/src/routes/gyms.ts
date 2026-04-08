import { Elysia, t } from "elysia";
import { eq, and, asc } from "drizzle-orm";
import { db, sql } from "../db";
import { userGyms } from "../db/schema";
import { authPlugin } from "../lib/auth";

export const gymRoutes = new Elysia({ prefix: "/gyms" })
  .use(authPlugin)

  // GET / — list user's gyms
  .get("/", async ({ userId }) => {
    const rows = await db
      .select()
      .from(userGyms)
      .where(eq(userGyms.userId, userId))
      .orderBy(asc(userGyms.createdAt));

    return rows;
  })

  // POST / — create a gym
  .post(
    "/",
    async ({ userId, body }) => {
      const [gym] = await db
        .insert(userGyms)
        .values({
          userId,
          name: body.name,
          latitude: body.latitude,
          longitude: body.longitude,
        })
        .returning();

      return gym;
    },
    {
      body: t.Object({
        name: t.String(),
        latitude: t.Optional(t.Number()),
        longitude: t.Optional(t.Number()),
      }),
    },
  )

  // PUT /:gymId — update a gym
  .put(
    "/:gymId",
    async ({ userId, params, body, set }) => {
      const [existing] = await db
        .select({ id: userGyms.id })
        .from(userGyms)
        .where(and(eq(userGyms.id, params.gymId), eq(userGyms.userId, userId)))
        .limit(1);

      if (!existing) {
        set.status = 404;
        return { error: "Gym not found" };
      }

      const updates: Record<string, unknown> = { name: body.name };
      if (body.latitude !== undefined) updates.latitude = body.latitude;
      if (body.longitude !== undefined) updates.longitude = body.longitude;

      const [updated] = await db
        .update(userGyms)
        .set(updates)
        .where(eq(userGyms.id, params.gymId))
        .returning();

      return updated;
    },
    {
      body: t.Object({
        name: t.String(),
        latitude: t.Optional(t.Number()),
        longitude: t.Optional(t.Number()),
      }),
    },
  )

  // DELETE /:gymId — delete a gym
  .delete("/:gymId", async ({ userId, params, set }) => {
    const [existing] = await db
      .select({ id: userGyms.id })
      .from(userGyms)
      .where(and(eq(userGyms.id, params.gymId), eq(userGyms.userId, userId)))
      .limit(1);

    if (!existing) {
      set.status = 404;
      return { error: "Gym not found" };
    }

    await db.delete(userGyms).where(eq(userGyms.id, params.gymId));

    set.status = 204;
    return;
  })

  // GET /:gymId/profile-mappings — get profile mappings for a gym
  .get("/:gymId/profile-mappings", async ({ userId, params }) => {
    const rows = await sql`
      SELECT exercise_id, profile_id
      FROM user_gym_profile_mappings
      WHERE user_id = ${userId} AND gym_id = ${params.gymId}
    `;

    return rows;
  })

  // PUT /:gymId/profile-mappings — upsert a profile mapping
  .put(
    "/:gymId/profile-mappings",
    async ({ userId, params, body }) => {
      await sql`
        INSERT INTO user_gym_profile_mappings (user_id, gym_id, exercise_id, profile_id)
        VALUES (${userId}, ${params.gymId}, ${body.exercise_id}, ${body.profile_id})
        ON CONFLICT (user_id, gym_id, exercise_id) DO UPDATE SET
          profile_id = ${body.profile_id},
          updated_at = NOW()
      `;

      return { exercise_id: body.exercise_id, profile_id: body.profile_id };
    },
    {
      body: t.Object({
        exercise_id: t.String(),
        profile_id: t.String(),
      }),
    },
  );
