import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { userSets, workouts } from "../db/schema";
import { authPlugin } from "../lib/auth";

export const setRoutes = new Elysia({ prefix: "/sets" })
  .use(authPlugin)

  // POST /workouts/:workoutId/sets — create a set
  .post(
    "/workouts/:workoutId/sets",
    async ({ userId, params, body, set }) => {
      // Verify workout ownership
      const [workout] = await db
        .select({ userId: workouts.userId })
        .from(workouts)
        .where(eq(workouts.id, params.workoutId))
        .limit(1);

      if (!workout || workout.userId !== userId) {
        set.status = 404;
        return { error: "Workout not found" };
      }

      const [created] = await db
        .insert(userSets)
        .values({
          userId,
          workoutId: params.workoutId,
          exerciseId: body.exercise_id,
          profileId: body.profile_id,
          reps: body.reps,
          weight: body.weight,
          weightUnit: body.weight_unit,
          side: body.side,
          bodyweight: body.bodyweight,
        })
        .returning();

      return created;
    },
    {
      body: t.Object({
        exercise_id: t.String(),
        profile_id: t.Optional(t.String()),
        reps: t.Number(),
        weight: t.String(),
        weight_unit: t.String(),
        side: t.Optional(t.String()),
        bodyweight: t.Optional(t.String()),
      }),
    },
  )

  // PUT /:setId — update a set
  .put(
    "/:setId",
    async ({ userId, params, body, set }) => {
      // Verify set ownership
      const [existing] = await db
        .select({ userId: userSets.userId })
        .from(userSets)
        .where(eq(userSets.id, params.setId))
        .limit(1);

      if (!existing || existing.userId !== userId) {
        set.status = 404;
        return { error: "Set not found" };
      }

      const updates: Record<string, unknown> = {};
      if (body.reps !== undefined) updates.reps = body.reps;
      if (body.weight !== undefined) updates.weight = body.weight;
      if (body.weight_unit !== undefined) updates.weightUnit = body.weight_unit;

      const [updated] = await db
        .update(userSets)
        .set(updates)
        .where(eq(userSets.id, params.setId))
        .returning();

      return updated;
    },
    {
      body: t.Object({
        reps: t.Optional(t.Number()),
        weight: t.Optional(t.String()),
        weight_unit: t.Optional(t.String()),
      }),
    },
  )

  // DELETE /:setId — delete a set
  .delete("/:setId", async ({ userId, params, set }) => {
    // Verify set ownership
    const [existing] = await db
      .select({ userId: userSets.userId })
      .from(userSets)
      .where(eq(userSets.id, params.setId))
      .limit(1);

    if (!existing || existing.userId !== userId) {
      set.status = 404;
      return { error: "Set not found" };
    }

    await db.delete(userSets).where(eq(userSets.id, params.setId));

    return "deleted";
  });
