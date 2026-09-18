import { Elysia, t } from "elysia";
import { authPlugin } from "../lib/auth";
import { sql } from "../db";
import { AgentError, ExerciseAgentService, publicSession } from "../exercise-agent/service";
export const exerciseAgentService = new ExerciseAgentService(sql);
const idParams = t.Object({ id: t.String({ format: "uuid" }) });
const revision = t.Integer({ minimum: 1, maximum: 20 });
const message = t.String({ minLength: 1, maxLength: 4000 });
const tokenBody = t.Object({
  token: t.String({
    pattern: "^(ExponentPushToken|ExpoPushToken)\\[[A-Za-z0-9_-]+\\]$",
    maxLength: 255,
  }),
});
export const exerciseAgentRoutes = new Elysia({ prefix: "/exercise-agent" })
  .use(authPlugin)
  .onBeforeHandle(({ user, set }) => {
    if (!user?.isAdmin) {
      set.status = 403;
      return { error: "Admin access required" };
    }
  })
  .onError(({ error, set }) => {
    if (error instanceof AgentError) {
      set.status = error.status;
      return { error: error.message };
    }
  })
  .get("/", async ({ userId }) => (await exerciseAgentService.list(userId)).map(publicSession))
  .post(
    "/",
    async ({ userId, body }) => {
      if (!process.env.OPENROUTER_API_KEY)
        throw new AgentError("Exercise generation is not configured", 503);
      return publicSession(await exerciseAgentService.create(userId, body.message));
    },
    { body: t.Object({ message }) },
  )
  .put(
    "/push-token",
    async ({ userId, body }) => {
      await exerciseAgentService.assertAdmin(userId);
      // Token ownership follows the currently authenticated account on this device.
      await sql`INSERT INTO exercise_agent_push_tokens(token,user_id) VALUES (${body.token},${userId}) ON CONFLICT(token) DO UPDATE SET user_id=EXCLUDED.user_id,updated_at=now()`;
      return { ok: true };
    },
    { body: tokenBody },
  )
  .delete(
    "/push-token",
    async ({ userId, body }) => {
      await sql`DELETE FROM exercise_agent_push_tokens WHERE token=${body.token} AND user_id=${userId}`;
      return { ok: true };
    },
    { body: tokenBody },
  )
  .get(
    "/:id",
    async ({ userId, params }) => publicSession(await exerciseAgentService.get(userId, params.id)),
    { params: idParams },
  )
  .post(
    "/:id/follow-up",
    async ({ userId, params, body }) => {
      if (!process.env.OPENROUTER_API_KEY)
        throw new AgentError("Exercise generation is not configured", 503);
      return publicSession(
        await exerciseAgentService.followUp(userId, params.id, body.revision, body.message),
      );
    },
    { params: idParams, body: t.Object({ message, revision }) },
  )
  .post(
    "/:id/approve",
    async ({ userId, params, body }) =>
      publicSession(await exerciseAgentService.approve(userId, params.id, body.revision)),
    { params: idParams, body: t.Object({ revision }) },
  )
  .post(
    "/:id/cancel",
    async ({ userId, params }) =>
      publicSession(await exerciseAgentService.cancel(userId, params.id)),
    { params: idParams, body: t.Object({}) },
  );
