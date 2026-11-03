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
 * gate's read-only token. Both must be set and well formed, or the feature is
 * off: nobody is enrolled (bootstrap tells phones so, and they record
 * nothing), check-ins already queued get 503 and stay queued, and the feed
 * answers 401.
 */

const DAY_MS = 86_400_000;
const DEFAULT_LOOKBACK_MS = 14 * DAY_MS;
/** How far back the feed answers, and how long check-ins are kept. */
const RETENTION_MS = 60 * DAY_MS;
/** Accept check-ins from up to 7 days ago; a retry keeps the first report until retention deletes it. */
const MAX_AGE_MS = 7 * DAY_MS;
/** Retention runs at most this often per process; it is housekeeping, not a guarantee. */
const RETENTION_EVERY_MS = 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function tokenHash(): string | null {
  const hash = process.env.GATE_FEED_TOKEN_SHA256?.trim().toLowerCase();
  return hash && /^[0-9a-f]{64}$/.test(hash) ? hash : null;
}

/**
 * The enrolled account, or null when the feature is off: both settings must
 * be present and well formed, or no location is collected at all.
 */
export function gateUserId(): string | null {
  // Lowercase: Postgres and the JWT `sub` print uuids in lowercase, and the
  // check-in route compares strings.
  const user = process.env.GATE_FEED_USER_ID?.trim().toLowerCase();
  return user && UUID.test(user) && tokenHash() ? user : null;
}

/**
 * Retention for every account, so old rows go even after enrollment changes.
 * Run from the enrolled check-in path and feed reads, at most once a minute.
 * The feed also filters by the retention window, so a skipped run hides nothing.
 */
let lastRetention = Number.NEGATIVE_INFINITY;
async function deleteExpired(now: number): Promise<void> {
  if (now - lastRetention < RETENTION_EVERY_MS && now >= lastRetention) return;
  lastRetention = now;
  await sql`
    DELETE FROM gym_checkins WHERE at < ${new Date(now - RETENTION_MS).toISOString()}::timestamptz
  `;
}

/** Tests only: let the next call run retention again. */
export function resetRetentionClock(): void {
  lastRetention = Number.NEGATIVE_INFINITY;
}

export const gateCheckinRoutes = new Elysia({ prefix: "/gate" })
  .use(authPlugin)
  // POST /checkins — idempotent per (workout, kind): a retry never moves the first report.
  .post(
    "/checkins",
    async ({ userId, body, set }) => {
      const tapped = Date.parse(body.at);
      const now = Date.now();
      if (Number.isNaN(tapped) || tapped < now - MAX_AGE_MS) {
        set.status = 400;
        return { error: "at must be an ISO time within the last 7 days" };
      }
      // A phone clock running fast is clamped, not refused (the phone drops a
      // 400): the tap cannot have happened after the server received it.
      const at = Math.min(tapped, now);
      // Unconfigured (or misconfigured) is temporary: 503 makes the phone keep
      // the check-ins it already queued and retry them. Another account's
      // check-ins are dropped unstored.
      const enrolled = gateUserId();
      if (!enrolled) {
        set.status = 503;
        return { error: "gym check-ins are not configured" };
      }
      if (userId !== enrolled) return { ok: true, stored: false };
      await deleteExpired(now);
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
  const hash = tokenHash();
  const token = /^Bearer\s+(.+)$/i.exec(authorization ?? "")?.[1]?.trim();
  if (!hash || !token) return false;
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
    await deleteExpired(now);
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
        SELECT w.id, w.client_id, w.start_time, w.end_time, w.kind, w.gym_location,
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
        gym_location: w.gym_location ?? null,
      })),
    };
  },
  { query: t.Object({ from: t.Optional(t.String()) }) },
);
