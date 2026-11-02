import { createHash, timingSafeEqual } from "node:crypto";
import { Elysia, t } from "elysia";
import { db, sql } from "../db";
import { gymCheckins } from "../db/schema";
import { authPlugin } from "../lib/auth";

/**
 * Gym check-ins for Alex's hygiene gate (alexng353/claude-codex-proxy,
 * src/gym.ts). The phone posts where it was when a workout started or
 * finished; the gate reads them, with finished workouts, through /gate/feed.
 */
export const gateCheckinRoutes = new Elysia({ prefix: "/gate" })
  .use(authPlugin)
  // POST /checkins — idempotent per (workout, kind): a retry never moves the first report.
  .post(
    "/checkins",
    async ({ userId, body, set }) => {
      const at = new Date(body.at);
      if (Number.isNaN(at.getTime())) {
        set.status = 400;
        return { error: "at must be an ISO time" };
      }
      const located = body.latitude != null && body.longitude != null;
      await db
        .insert(gymCheckins)
        .values({
          userId,
          clientWorkoutId: body.client_workout_id,
          kind: body.kind,
          at,
          latitude: located ? body.latitude : null,
          longitude: located ? body.longitude : null,
          accuracyM: body.accuracy_m ?? null,
        })
        .onConflictDoNothing();
      return { ok: true };
    },
    {
      body: t.Object({
        client_workout_id: t.String({ minLength: 1, maxLength: 64 }),
        kind: t.Union([t.Literal("start"), t.Literal("finish")]),
        at: t.String(),
        latitude: t.Optional(t.Nullable(t.Number({ minimum: -90, maximum: 90 }))),
        longitude: t.Optional(t.Nullable(t.Number({ minimum: -180, maximum: 180 }))),
        accuracy_m: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
      }),
    },
  );

const MAX_LOOKBACK_MS = 60 * 86_400_000;

/**
 * The gate's read-only token: GATE_FEED_TOKEN_SHA256 holds its SHA-256 (hex),
 * GATE_FEED_USER_ID the one user it may read. With either unset the feed is off.
 */
function feedUser(authorization: string | undefined): string | null {
  const hash = process.env.GATE_FEED_TOKEN_SHA256?.trim().toLowerCase();
  const user = process.env.GATE_FEED_USER_ID?.trim();
  const token = /^Bearer\s+(.+)$/i.exec(authorization ?? "")?.[1]?.trim();
  if (!hash || !user || !token || !/^[0-9a-f]{64}$/.test(hash)) return null;
  const given = createHash("sha256").update(token).digest();
  return timingSafeEqual(given, Buffer.from(hash, "hex")) ? user : null;
}

export const gateFeedRoutes = new Elysia({ prefix: "/gate" }).get(
  "/feed",
  async ({ headers, query, set }) => {
    const userId = feedUser(headers.authorization);
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const now = Date.now();
    const asked = query.from ? Date.parse(query.from) : now - 14 * 86_400_000;
    if (Number.isNaN(asked)) {
      set.status = 400;
      return { error: "from must be an ISO time" };
    }
    // postgres.js won't bind a Date here; send ISO text with an explicit cast.
    const from = new Date(Math.max(asked, now - MAX_LOOKBACK_MS)).toISOString();
    const [checkins, workouts] = await Promise.all([
      sql`
        SELECT client_workout_id, kind, at, latitude, longitude, accuracy_m
        FROM gym_checkins
        WHERE user_id = ${userId} AND at >= ${from}::timestamptz
        ORDER BY at ASC
      `,
      sql`
        SELECT w.id, w.client_id, w.start_time, w.end_time, w.kind, COUNT(s.id)::int AS set_count
        FROM workouts w LEFT JOIN user_sets s ON s.workout_id = w.id
        WHERE w.user_id = ${userId} AND w.start_time >= ${from}::timestamptz
        GROUP BY w.id
        ORDER BY w.start_time ASC
      `,
    ]);
    const isoOrNull = (v: unknown) => (v ? new Date(v as string).toISOString() : null);
    return {
      checkins: checkins.map((c) => ({
        client_workout_id: c.client_workout_id,
        kind: c.kind,
        at: isoOrNull(c.at),
        latitude: c.latitude,
        longitude: c.longitude,
        accuracy_m: c.accuracy_m,
      })),
      workouts: workouts.map((w) => ({
        id: w.id,
        client_id: w.client_id,
        start_time: isoOrNull(w.start_time),
        end_time: isoOrNull(w.end_time),
        kind: w.kind,
        set_count: w.set_count,
      })),
    };
  },
  { query: t.Object({ from: t.Optional(t.String()) }) },
);
