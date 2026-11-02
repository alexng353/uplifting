import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { createHash } from "node:crypto";
import { Elysia } from "elysia";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../src/db/schema";

// Point this at a local test Postgres socket. Each run creates and drops its own database.
const socket = process.env.UPLIFTING_TEST_PG_SOCKET;
const TOKEN = "test-gate-token";
// Dates relative to now, so the feed's 60-day window never ages the fixtures out.
const HOUR = 3_600_000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();

describe.skipIf(!socket)("gym gate", () => {
  const admin = postgres({ host: socket, database: "postgres" });
  const database = `uplifting_test_${crypto.randomUUID().replaceAll("-", "")}`;
  const sql = postgres({ host: socket, database, max: 1 });
  const db = drizzle(sql, { schema });
  let alex: string;
  let other: string;
  let exerciseId: string;
  let actingAs = "";
  let app: Elysia;

  beforeAll(async () => {
    await admin`CREATE DATABASE ${admin(database)}`;
    await migrate(db, { migrationsFolder: `${import.meta.dir}/../drizzle` });
    const [a, o] = await db
      .insert(schema.users)
      .values([
        { realName: "Alex", username: "alex", email: "alex@example.com", passwordHash: "unused" },
        {
          realName: "Other",
          username: "other",
          email: "other@example.com",
          passwordHash: "unused",
        },
      ])
      .returning();
    alex = a.id;
    other = o.id;
    actingAs = alex;
    const [exercise] = await db
      .insert(schema.exercises)
      .values({ name: "Curl", exerciseType: "dumbbell" })
      .returning();
    exerciseId = exercise.id;
    process.env.GATE_FEED_TOKEN_SHA256 = createHash("sha256").update(TOKEN).digest("hex");
    process.env.GATE_FEED_USER_ID = alex;

    mock.module("../src/db", () => ({ db, sql }));
    mock.module("../src/lib/auth", () => ({
      authPlugin: new Elysia().derive({ as: "scoped" }, () => ({ userId: actingAs })),
    }));
    const { syncRoutes } = await import("../src/routes/sync");
    const { gateCheckinRoutes, gateFeedRoutes } = await import("../src/routes/gate");
    app = new Elysia().use(syncRoutes).use(gateCheckinRoutes).use(gateFeedRoutes);
  });

  afterAll(async () => {
    await sql.end();
    await admin`DROP DATABASE IF EXISTS ${admin(database)}`;
    await admin.end();
  });

  const call = async (
    path: string,
    init: { method?: string; body?: unknown; token?: string } = {},
  ) => {
    const response = await app.handle(
      new Request(`http://localhost${path}`, {
        method: init.method ?? "GET",
        headers: {
          "Content-Type": "application/json",
          ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
        },
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      }),
    );
    const text = await response.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {}
    return { status: response.status, body };
  };
  const checkin = (body: Record<string, unknown>) =>
    call("/gate/checkins", {
      method: "POST",
      body: { latitude: null, longitude: null, accuracy_m: null, ...body },
    });
  const feed = (from?: string, token = TOKEN) =>
    call(`/gate/feed${from ? `?from=${encodeURIComponent(from)}` : ""}`, { token });
  const syncWorkout = (body: Record<string, unknown>) =>
    call("/sync/workout", { method: "POST", body: { exercises: [], ...body } });

  test("check-ins are stored once per workout and kind; a retry never moves the first", async () => {
    const start = {
      client_workout_id: "c1",
      kind: "start",
      at: ago(2),
      latitude: 49.26346,
      longitude: -123.12054,
      accuracy_m: 12,
    };
    expect((await checkin(start)).body).toEqual({ ok: true, stored: true });
    expect((await checkin({ ...start, latitude: 0, longitude: 0 })).status).toBe(200);
    expect((await checkin({ client_workout_id: "c1", kind: "finish", at: ago(1) })).status).toBe(
      200,
    );
    const rows =
      await sql`SELECT kind, latitude FROM gym_checkins WHERE client_workout_id = 'c1' ORDER BY kind`;
    expect(rows.map((r) => [r.kind, r.latitude])).toEqual([
      ["finish", null],
      ["start", 49.26346],
    ]);
  });

  test("another account's check-ins are accepted but never stored", async () => {
    actingAs = other;
    try {
      expect(
        (
          await checkin({
            client_workout_id: "o1",
            kind: "start",
            at: ago(2),
            latitude: 1,
            longitude: 1,
            accuracy_m: 5,
          })
        ).body,
      ).toEqual({
        ok: true,
        stored: false,
      });
    } finally {
      actingAs = alex;
    }
    expect(
      (await sql`SELECT count(*)::int AS n FROM gym_checkins WHERE user_id = ${other}`)[0].n,
    ).toBe(0);
  });

  test("bad check-ins are refused", async () => {
    expect((await checkin({ client_workout_id: "c2", kind: "middle", at: ago(1) })).status).toBe(
      422,
    );
    expect((await checkin({ client_workout_id: "c2", kind: "start", at: "later" })).status).toBe(
      400,
    );
    expect(
      (await checkin({ client_workout_id: "c2", kind: "start", at: ago(24 * 8) })).status,
    ).toBe(400);
    expect((await checkin({ client_workout_id: "c2", kind: "start", at: ago(-1) })).status).toBe(
      400,
    );
    expect(
      (
        await checkin({
          client_workout_id: "c2",
          kind: "start",
          at: ago(1),
          latitude: 99,
          longitude: 0,
        })
      ).status,
    ).toBe(422);
  });

  test("bootstrap tells only the enrolled account to send check-ins", async () => {
    expect((await call("/sync/bootstrap")).body.gym_checkins_user_id).toBe(alex);
    actingAs = other;
    try {
      expect((await call("/sync/bootstrap")).body.gym_checkins_user_id).toBeNull();
    } finally {
      actingAs = alex;
    }
  });

  test("a retried sync with the same client_id returns the first workout, not a copy", async () => {
    const body = { client_id: "dup-1", start_time: ago(5), end_time: ago(4) };
    const first = await syncWorkout(body);
    const second = await syncWorkout(body);
    expect(first.status).toBe(200);
    expect(second.body.workout_id).toBe(first.body.workout_id);
    expect(
      (await sql`SELECT count(*)::int AS n FROM workouts WHERE client_id = 'dup-1'`)[0].n,
    ).toBe(1);
  });

  test("the feed needs the gate token and returns only the enrolled account's data", async () => {
    const sets = (side: string | undefined, n: number) =>
      Array.from({ length: n }, () => ({
        reps: 10,
        weight: 20,
        weight_unit: "kg",
        ...(side ? { side } : {}),
      }));
    // Three one-sided pairs plus two bilateral sets: five sets, not eight.
    const synced = await syncWorkout({
      client_id: "c1",
      start_time: ago(2),
      end_time: ago(1),
      exercises: [
        {
          exercise_id: exerciseId,
          sets: [...sets("R", 3), ...sets("L", 3), ...sets(undefined, 2)],
        },
      ],
    });
    expect(synced.status).toBe(200);
    actingAs = other;
    try {
      await syncWorkout({ client_id: "o1", start_time: ago(2), end_time: ago(1) });
    } finally {
      actingAs = alex;
    }
    // A row older than the 60-day window, inserted directly.
    await sql`INSERT INTO gym_checkins (user_id, client_workout_id, kind, at) VALUES (${alex}, 'old', 'start', ${ago(24 * 61)}::timestamptz)`;

    expect((await feed(undefined, "wrong")).status).toBe(401);
    expect((await call("/gate/feed")).status).toBe(401);
    expect((await feed("soon")).status).toBe(400);

    const { status, body } = await feed(ago(24 * 90));
    expect(status).toBe(200);
    expect(body.checkins.map((c: any) => [c.client_workout_id, c.kind])).toEqual([
      ["c1", "start"],
      ["c1", "finish"],
    ]);
    const ids = body.workouts.map((w: any) => w.client_id);
    expect(ids).toContain("c1");
    expect(ids).not.toContain("o1");
    expect(body.workouts.find((w: any) => w.client_id === "c1")).toMatchObject({
      id: synced.body.workout_id,
      kind: "workout",
      set_count: 5,
    });
  });

  test("old check-ins are deleted on the next insert", async () => {
    await sql`INSERT INTO gym_checkins (user_id, client_workout_id, kind, at) VALUES (${alex}, 'older', 'start', ${ago(24 * 61)}::timestamptz)`;
    await checkin({ client_workout_id: "c3", kind: "start", at: ago(1) });
    expect(
      (
        await sql`SELECT count(*)::int AS n FROM gym_checkins WHERE client_workout_id IN ('old', 'older')`
      )[0].n,
    ).toBe(0);
  });

  test("a feed user that isn't a user answers 503; unset or malformed turns the feed off", async () => {
    const saved = process.env.GATE_FEED_USER_ID;
    try {
      process.env.GATE_FEED_USER_ID = crypto.randomUUID();
      expect((await feed()).status).toBe(503);
      process.env.GATE_FEED_USER_ID = "not-a-uuid";
      expect((await feed()).status).toBe(401);
      delete process.env.GATE_FEED_USER_ID;
      expect((await feed()).status).toBe(401);
    } finally {
      process.env.GATE_FEED_USER_ID = saved;
    }
  });
});
