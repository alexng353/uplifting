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

describe.skipIf(!socket)("gym gate", () => {
  const admin = postgres({ host: socket, database: "postgres" });
  const database = `uplifting_test_${crypto.randomUUID().replaceAll("-", "")}`;
  const sql = postgres({ host: socket, database, max: 1 });
  const db = drizzle(sql, { schema });
  let userId: string;
  let otherId: string;
  let actingAs = "";
  let app: Elysia;

  beforeAll(async () => {
    await admin`CREATE DATABASE ${admin(database)}`;
    await migrate(db, { migrationsFolder: `${import.meta.dir}/../drizzle` });
    const [user, other] = await db
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
    userId = user.id;
    otherId = other.id;
    actingAs = userId;
    process.env.GATE_FEED_TOKEN_SHA256 = createHash("sha256").update(TOKEN).digest("hex");
    process.env.GATE_FEED_USER_ID = userId;

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
    call("/gate/checkins", { method: "POST", body });
  const feed = (from?: string, token = TOKEN) =>
    call(`/gate/feed${from ? `?from=${encodeURIComponent(from)}` : ""}`, { token });

  test("check-ins are stored once per workout and kind; a retry never moves the first", async () => {
    const start = {
      client_workout_id: "c1",
      kind: "start",
      at: "2026-11-05T02:00:00.000Z",
      latitude: 49.26346,
      longitude: -123.12054,
      accuracy_m: 12,
    };
    expect((await checkin(start)).status).toBe(200);
    expect((await checkin({ ...start, latitude: 0, longitude: 0 })).status).toBe(200);
    expect(
      (
        await checkin({
          client_workout_id: "c1",
          kind: "finish",
          at: "2026-11-05T03:00:00.000Z",
          latitude: null,
          longitude: null,
        })
      ).status,
    ).toBe(200);
    const rows =
      await sql`SELECT kind, latitude FROM gym_checkins WHERE client_workout_id = 'c1' ORDER BY kind`;
    expect(rows.map((r) => [r.kind, r.latitude])).toEqual([
      ["finish", null],
      ["start", 49.26346],
    ]);
  });

  test("bad check-ins are refused", async () => {
    expect(
      (await checkin({ client_workout_id: "c2", kind: "middle", at: "2026-11-05T02:00:00Z" }))
        .status,
    ).toBe(422);
    expect((await checkin({ client_workout_id: "c2", kind: "start", at: "later" })).status).toBe(
      400,
    );
    expect(
      (
        await checkin({
          client_workout_id: "c2",
          kind: "start",
          at: "2026-11-05T02:00:00Z",
          latitude: 99,
          longitude: 0,
        })
      ).status,
    ).toBe(422);
  });

  test("the feed needs the gate token and returns the token user's check-ins and workouts", async () => {
    const synced = await call("/sync/workout", {
      method: "POST",
      body: {
        client_id: "c1",
        start_time: "2026-11-05T02:00:00.000Z",
        end_time: "2026-11-05T03:00:00.000Z",
        exercises: [],
      },
    });
    expect(synced.status).toBe(200);
    actingAs = otherId;
    await checkin({
      client_workout_id: "o1",
      kind: "start",
      at: "2026-11-05T02:00:00.000Z",
      latitude: 1,
      longitude: 1,
    });
    actingAs = userId;

    expect((await feed(undefined, "wrong")).status).toBe(401);
    expect((await call("/gate/feed")).status).toBe(401);
    expect((await feed("soon")).status).toBe(400);

    const { status, body } = await feed("2026-11-04T00:00:00.000Z");
    expect(status, JSON.stringify(body)).toBe(200);
    expect(body.checkins.map((c: any) => [c.client_workout_id, c.kind])).toEqual([
      ["c1", "start"],
      ["c1", "finish"],
    ]);
    expect(body.workouts).toEqual([
      {
        id: synced.body.workout_id,
        client_id: "c1",
        start_time: "2026-11-05T02:00:00.000Z",
        end_time: "2026-11-05T03:00:00.000Z",
        kind: "workout",
        set_count: 0,
      },
    ]);
  });

  test("with the token settings unset the feed is off", async () => {
    const saved = process.env.GATE_FEED_USER_ID;
    delete process.env.GATE_FEED_USER_ID;
    try {
      expect((await feed()).status).toBe(401);
    } finally {
      process.env.GATE_FEED_USER_ID = saved;
    }
  });
});
