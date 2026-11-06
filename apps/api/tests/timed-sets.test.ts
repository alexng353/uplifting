import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { createHash } from "node:crypto";
import { Elysia } from "elysia";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../src/db/schema";

// Point this at a local test Postgres. Each run creates and drops its own database.
const socket = process.env.UPLIFTING_TEST_PG_SOCKET;
const TOKEN = "timed-feed-token";
const HOUR = 3_600_000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();

describe.skipIf(!socket)("timed sets", () => {
  const admin = postgres({ host: socket, database: "postgres" });
  const database = `uplifting_test_${crypto.randomUUID().replaceAll("-", "")}`;
  const sql = postgres({ host: socket, database, max: 1 });
  const db = drizzle(sql, { schema });
  let app: Elysia;
  let walkId: string;
  let curlId: string;

  beforeAll(async () => {
    await admin`CREATE DATABASE ${admin(database)}`;
    await migrate(db, { migrationsFolder: `${import.meta.dir}/../drizzle` });
    const [user] = await db
      .insert(schema.users)
      .values({ realName: "T", username: "timed", email: "t@example.com", passwordHash: "x" })
      .returning();
    const [curl] = await db
      .insert(schema.exercises)
      .values({ name: "Curl", exerciseType: "dumbbell", official: true })
      .returning();
    curlId = curl.id;
    process.env.GATE_FEED_TOKEN_SHA256 = createHash("sha256").update(TOKEN).digest("hex");
    process.env.GATE_FEED_USER_ID = user.id;
    mock.module("../src/db", () => ({ db, sql }));
    mock.module("../src/lib/auth", () => ({
      authPlugin: new Elysia().derive({ as: "scoped" }, () => ({ userId: user.id })),
    }));
    const { syncRoutes } = await import("../src/routes/sync");
    const { exerciseRoutes } = await import("../src/routes/exercises");
    const { workoutRoutes } = await import("../src/routes/workouts");
    const { gateFeedRoutes } = await import("../src/routes/gate");
    app = new Elysia().use(syncRoutes).use(exerciseRoutes).use(workoutRoutes).use(gateFeedRoutes);
  });

  afterAll(async () => {
    await sql.end();
    await admin`DROP DATABASE IF EXISTS ${admin(database)}`;
    await admin.end();
  });

  const call = async (path: string, method = "GET", body?: unknown, token?: string) => {
    const response = await app.handle(
      new Request(`http://localhost${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
    const text = await response.text();
    expect(response.status, text).toBe(200);
    return JSON.parse(text);
  };

  const walk = (minutes: number) => ({
    reps: 1,
    weight: 0,
    weight_unit: "lbs",
    duration_seconds: minutes * 60,
    speed: 2.5,
    speed_unit: "mph",
    incline: 12,
  });

  test("the migration seeds the treadmill walk as a timed exercise, once", async () => {
    const rows =
      await sql`SELECT id, measure FROM exercises WHERE name = 'Reverse Incline Treadmill Walk'`;
    expect(rows).toHaveLength(1);
    expect(rows[0].measure).toBe("timed");
    walkId = rows[0].id;
    const list = await call("/exercises?limit=500");
    const byName = Object.fromEntries(list.map((e: any) => [e.name, e.measure]));
    expect(byName["Reverse Incline Treadmill Walk"]).toBe("timed");
    expect(byName.Curl).toBe("weights");
  });

  test("timed sets round-trip and weight sets keep their old shape", async () => {
    const synced = await call("/sync/workout", "POST", {
      client_id: "w1",
      start_time: ago(2),
      end_time: ago(1),
      exercises: [
        {
          exercise_id: walkId,
          sets: [walk(10), { ...walk(5), speed: undefined, incline: undefined }],
        },
        {
          exercise_id: curlId,
          sets: [1, 2, 3, 4].map(() => ({ reps: 10, weight: 30, weight_unit: "lbs" })),
        },
      ],
    });
    const prev = synced.previous_sets[`${walkId}_default`];
    expect(prev[0]).toMatchObject({
      duration_seconds: 600,
      speed: 2.5,
      speed_unit: "mph",
      incline: 12,
    });
    expect(prev[1]).toMatchObject({ duration_seconds: 300, speed: null, incline: null });
    // Weight sets carry no timed keys at all.
    expect(Object.keys(synced.previous_sets[`${curlId}_default`][0])).not.toContain(
      "duration_seconds",
    );

    const bootstrap = await call("/sync/bootstrap");
    expect(bootstrap.previous_sets[`${walkId}_default`][0].duration_seconds).toBe(600);

    const history = await call(`/exercises/${walkId}/history`);
    expect(history.history[0].sets.map((s: any) => s.duration_seconds)).toEqual([600, 300]);

    const saved = await call(`/workouts/${synced.workout_id}`);
    expect(saved.exercises[0].sets[0].durationSeconds).toBe(600);

    // A walk never becomes a personal record or inflates the rep count.
    const details = await call(`/exercises/${walkId}`);
    expect(details.measure).toBe("timed");
    expect(details.personal_record).toBeNull();
    const summary = await call(`/workouts/${synced.workout_id}/summary`);
    expect(summary.total_reps).toBe(40);
    expect(summary.total_sets).toBe(6);
  });

  test("the gate feed counts timed sets toward the six-set rule, contract unchanged", async () => {
    await call("/sync/workout", "POST", {
      client_id: "cardio-only",
      start_time: ago(0.8),
      end_time: ago(0.5),
      exercises: [{ exercise_id: walkId, sets: [1, 2, 3, 4, 5, 6].map(() => walk(5)) }],
    });
    const feed = await call(
      `/gate/feed?from=${encodeURIComponent(ago(3))}`,
      "GET",
      undefined,
      TOKEN,
    );
    const byClient = Object.fromEntries(feed.workouts.map((w: any) => [w.client_id, w]));
    expect(byClient.w1.set_count).toBe(6);
    expect(byClient["cardio-only"].set_count).toBe(6);
    expect(Object.keys(byClient.w1).sort()).toEqual(
      ["client_id", "end_time", "gym_location", "id", "kind", "set_count", "start_time"].sort(),
    );
  });

  test("editing a workout keeps timed values", async () => {
    const synced = await call("/sync/workout", "POST", {
      start_time: ago(5),
      end_time: ago(4),
      exercises: [{ exercise_id: walkId, sets: [walk(8)] }],
    });
    await call(`/workouts/${synced.workout_id}`, "PUT", {
      exercises: [
        { exercise_id: walkId, sets: [{ ...walk(12), distance: 0.6, distance_unit: "mi" }] },
      ],
    });
    const edited = await call(`/workouts/${synced.workout_id}`);
    expect(edited.exercises[0].sets[0]).toMatchObject({
      durationSeconds: 720,
      distance: "0.600",
      distanceUnit: "mi",
    });
  });

  test("warmup sets are kept and counted by the gate, but not in volume or PRs", async () => {
    const synced = await call("/sync/workout", "POST", {
      client_id: "warm",
      start_time: ago(0.4),
      end_time: ago(0.2),
      exercises: [
        {
          exercise_id: curlId,
          sets: [
            { reps: 10, weight: 200, weight_unit: "lbs", is_warmup: true },
            { reps: 10, weight: 50, weight_unit: "lbs" },
          ],
        },
      ],
    });
    const summary = await call(`/workouts/${synced.workout_id}/summary`);
    expect(summary.total_sets).toBe(2);
    expect(summary.total_volume).toBeCloseTo(50 * 10 * 0.453592, 1);
    expect((await call(`/exercises/${curlId}`)).personal_record.weight).toBe(50);
    const prev = synced.previous_sets[`${curlId}_default`];
    expect(prev[0].is_warmup).toBe(true);
    expect(Object.keys(prev[1])).not.toContain("is_warmup");
    const feed = await call(
      `/gate/feed?from=${encodeURIComponent(ago(1))}`,
      "GET",
      undefined,
      TOKEN,
    );
    expect(feed.workouts.find((w: any) => w.client_id === "warm").set_count).toBe(2);
  });
});
