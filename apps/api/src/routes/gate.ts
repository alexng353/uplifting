import { createHash, timingSafeEqual } from "node:crypto";
import { Elysia, t } from "elysia";
import { db, sql } from "../db";
import { gymCheckins } from "../db/schema";
import { authPlugin } from "../lib/auth";

/**
 * Gym check-ins for one enrolled account: Alex's hygiene gate
 * (alexng353/claude-codex-proxy, src/gym.ts). This is a private integration,
 * not a product feature. The phone posts where it was when a workout started
 * or finished; the gate reads them, with finished workouts, through /gate/feed.
 *
 * GATE_FEED_USER_ID names the enrolled account and GATE_FEED_TOKEN_SHA256 the
 * gate's read-only token. With either unset or malformed the feature is off:
 * check-ins are accepted and dropped, and the feed answers 401.
 */

const DAY_MS = 86_400_000;
const DEFAULT_LOOKBACK_MS = 14 * DAY_MS;
/** How far back the feed answers, and how long check-ins are kept. */
const RETENTION_MS = 60 * DAY_MS;
/** A check-in's time must fall in [now - 7 d, now + 5 min]; the first report is kept forever. */
const MAX_AGE_MS = 7 * DAY_MS;
const MAX_FUTURE_MS = 5 * 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The enrolled account, or null when the feature is off. */
export function gateUserId(): string | null {
  const user = process.env.GATE_FEED_USER_ID?.trim();
  return user && UUID.test(user) ? user : null;
}

export const gateCheckinRoutes = new Elysia({ prefix: "/gate" })
  .use(authPlugin)
  // POST /checkins — idempotent per (workout, kind): a retry never moves the first report.
  .post(
    "/checkins",
    async ({ userId, body, set }) => {
      const at = Date.parse(body.at);
      const now = Date.now();
      if (Number.isNaN(at) || at < now - MAX_AGE_MS || at > now + MAX_FUTURE_MS) {
        set.status = 400;
        return { error: "at must be an ISO time within the last 7 days" };
      }
      // Only the enrolled account's locations are kept; anyone else's are dropped unstored.
      if (userId !== gateUserId()) return { ok: true, stored: false };
      const located = body.latitude != null && body.longitude != null;
      await db
        .insert(gymCheckins)
        .values({
          userId,
          clientWorkoutId: body.client_workout_id,
          kind: body.kind,
          at: new Date(at),
          latitude: located ? body.latitude : null,
          longitude: located ? body.longitude : null,
          accuracyM: body.accuracy_m ?? null,
        })
        .onConflictDoNothing();
      // Retention: nothing reads check-ins older than the feed's window.
      await sql`
        DELETE FROM gym_checkins
        WHERE user_id = ${userId} AND at < ${new Date(now - RETENTION_MS).toISOString()}::timestamptz
      `;
      return { ok: true, stored: true };
    },
    {
      body: t.Object({
        client_workout_id: t.String({ minLength: 1, maxLength: 64 }),
        kind: t.Union([t.Literal("start"), t.Literal("finish")]),
        at: t.String(),
        latitude: t.Nullable(t.Number({ minimum: -90, maximum: 90 })),
        longitude: t.Nullable(t.Number({ minimum: -180, maximum: 180 })),
        accuracy_m: t.Nullable(t.Number({ minimum: 0 })),
      }),
    },
  );

function feedAuthorized(authorization: string | undefined): boolean {
  const hash = process.env.GATE_FEED_TOKEN_SHA256?.trim().toLowerCase();
  const token = /^Bearer\s+(.+)$/i.exec(authorization ?? "")?.[1]?.trim();
  if (!hash || !token || !/^[0-9a-f]{64}$/.test(hash)) return false;
  const given = createHash("sha256").update(token).digest();
  return timingSafeEqual(given, Buffer.from(hash, "hex"));
}

// Not under authPlugin: the gate has no user JWT, only the read-only feed token.
export const gateFeedRoutes = new Elysia({ prefix: "/gate" }).get(
  "/feed",
  async ({ headers, query, set }) => {
    const userId = gateUserId();
    if (!userId || !feedAuthorized(headers.authorization)) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const now = Date.now();
    const asked = query.from ? Date.parse(query.from) : now - DEFAULT_LOOKBACK_MS;
    if (Number.isNaN(asked)) {
      set.status = 400;
      return { error: "from must be an ISO time" };
    }
    // An empty answer for a user who doesn't exist would read as "no Start" and lock the gate.
    const [exists] = await sql`SELECT 1 FROM users WHERE id = ${userId}`;
    if (!exists) {
      set.status = 503;
      return { error: "gate feed misconfigured: GATE_FEED_USER_ID is not a user" };
    }
    // postgres.js won't bind a Date here; send ISO text with an explicit cast.
    const from = new Date(Math.max(asked, now - RETENTION_MS)).toISOString();
    const [checkins, workouts] = await Promise.all([
      sql`
        SELECT client_workout_id, kind, at, latitude, longitude, accuracy_m
        FROM gym_checkins
        WHERE user_id = ${userId} AND at >= ${from}::timestamptz
        ORDER BY at ASC
      `,
      // A one-sided pair is stored as R and L rows; count it once, as workouts.ts does.
      sql`
        SELECT w.id, w.client_id, w.start_time, w.end_time, w.kind,
          COUNT(s.id) FILTER (WHERE s.side IS NULL OR s.side = 'R')::int AS set_count
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
