import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { Elysia } from "elysia";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../src/db/schema";

// Point this at a local test Postgres socket. Each run creates and drops its own database.
const socket = process.env.UPLIFTING_TEST_PG_SOCKET;

describe.skipIf(!socket)("workout history", () => {
  const admin = postgres({ host: socket, database: "postgres" });
  const database = `uplifting_test_${crypto.randomUUID().replaceAll("-", "")}`;
  const sql = postgres({ host: socket, database, max: 1 });
  const db = drizzle(sql, { schema });
  let userId: string;
  let app: Elysia;

  beforeAll(async () => {
    await admin`CREATE DATABASE ${admin(database)}`;
    await migrate(db, { migrationsFolder: `${import.meta.dir}/../drizzle` });
    const [user] = await db
      .insert(schema.users)
      .values({
        realName: "Test",
        username: "fractional-reps",
        email: "test@example.com",
        passwordHash: "unused",
      })
      .returning();
    userId = user.id;

    mock.module("../src/db", () => ({ db, sql }));
    mock.module("../src/lib/auth", () => ({
      authPlugin: new Elysia().derive({ as: "scoped" }, () => ({ userId: user.id })),
    }));
    const { syncRoutes } = await import("../src/routes/sync");
    const { exerciseRoutes } = await import("../src/routes/exercises");
    const { workoutRoutes } = await import("../src/routes/workouts");
    app = new Elysia().use(syncRoutes).use(exerciseRoutes).use(workoutRoutes);
  });

  afterAll(async () => {
    await sql.end();
    await admin`DROP DATABASE IF EXISTS ${admin(database)}`;
    await admin.end();
  });

  const request = async (path: string, method = "GET", body?: unknown) => {
    const response = await app.handle(
      new Request(`http://localhost${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
    const result = await response.text();
    expect(response.status, result).toBe(200);
    return JSON.parse(result);
  };

  test("fractional reps round-trip through sync, history, and workout edits", async () => {
    // Exercise the upgrade with existing integer data as well as a fresh schema.
    await sql`CREATE TEMP TABLE user_sets (reps integer NOT NULL CHECK (reps > 0))`;
    await sql`INSERT INTO user_sets VALUES (10), (2147483647)`;
    await sql.unsafe(
      await Bun.file(`${import.meta.dir}/../drizzle/0004_fractional_reps.sql`).text(),
    );
    await sql`INSERT INTO user_sets VALUES (0.25)`;
    const upgraded = await sql`SELECT reps FROM user_sets ORDER BY reps`;
    expect(upgraded.map((row) => Number(row.reps))).toEqual([0.25, 10, 2147483647]);
    await sql`DROP TABLE pg_temp.user_sets`;
    const [exercise] = await db
      .insert(schema.exercises)
      .values({ name: "Squat", exerciseType: "barbell" })
      .returning();
    const workoutBody = {
      start_time: "2026-09-06T12:00:00Z",
      end_time: "2026-09-06T12:30:00Z",
      exercises: [
        {
          exercise_id: exercise.id,
          sets: [10, 10.5, 0.25].map((reps, index) => ({
            reps,
            weight: 20.5,
            weight_unit: "kg",
            created_at: `2026-09-06T12:00:0${index}Z`,
          })),
        },
      ],
    };
    const synced = await request("/sync/workout", "POST", workoutBody);
    const key = `${exercise.id}_default`;
    expect(synced.previous_sets[key].map((set: { reps: number }) => set.reps)).toEqual([
      10, 10.5, 0.25,
    ]);

    const bootstrap = await request("/sync/bootstrap");
    expect(bootstrap.previous_sets[key].map((set: { reps: number }) => set.reps)).toEqual([
      10, 10.5, 0.25,
    ]);
    const details = await request(`/exercises/${exercise.id}`);
    expect(details.personal_record.reps).toBe(10.5);
    const history = await request(`/exercises/${exercise.id}/history`);
    expect(history.history[0].sets.map((set: { reps: number }) => set.reps)).toEqual([
      10, 10.5, 0.25,
    ]);
    const saved = await request(`/workouts/${synced.workout_id}`);
    expect(saved.exercises[0].sets.map((set: { reps: number }) => set.reps)).toEqual([
      10, 10.5, 0.25,
    ]);

    await request(`/workouts/${synced.workout_id}`, "PUT", {
      ...workoutBody,
      exercises: [
        {
          exercise_id: exercise.id,
          sets: [{ reps: 11.75, weight: 22.5, weight_unit: "kg" }],
        },
      ],
    });
    const edited = await request(`/workouts/${synced.workout_id}`);
    expect(edited.exercises[0].sets[0].reps).toBe(11.75);
  });

  test("sync and bootstrap retain the latest history per mode and profile", async () => {
    const [exercise] = await db
      .insert(schema.exercises)
      .values({ name: "Leg Press", exerciseType: "machine" })
      .returning();
    const [profile] = await db
      .insert(schema.exerciseProfiles)
      .values({ userId, exerciseId: exercise.id, name: "Other machine" })
      .returning();
    type SetInput = { weight: number; reps: number; weight_unit: string; side?: "L" | "R" };
    const bilateral = (weight: number): SetInput => ({ weight, reps: 10, weight_unit: "lbs" });
    const unilateral = (weight: number): SetInput[] => [
      { ...bilateral(weight), side: "R" },
      { ...bilateral(weight - 5), side: "L" },
    ];
    const key = `${exercise.id}_default`;
    const profileKey = `${exercise.id}_${profile.id}`;
    const expected: Record<string, SetInput[]> = {};

    const submit = async (day: number, sets: SetInput[], profileId?: string) => {
      const date = `2026-09-${String(day).padStart(2, "0")}`;
      const synced = await request("/sync/workout", "POST", {
        start_time: `${date}T12:00:00Z`,
        end_time: `${date}T12:30:00Z`,
        exercises: [
          {
            exercise_id: exercise.id,
            profile_id: profileId,
            sets: sets.map((set, index) => ({
              ...set,
              created_at: `${date}T12:00:${String(index).padStart(2, "0")}Z`,
            })),
          },
        ],
      });
      const bootstrap = await request("/sync/bootstrap");
      for (const [historyKey, history] of Object.entries(expected)) {
        for (const result of [synced, bootstrap]) {
          expect(
            result.previous_sets[historyKey].map((set: SetInput) => ({
              weight: Number(set.weight),
              reps: set.reps,
              weight_unit: set.weight_unit,
              ...(set.side == null ? {} : { side: set.side }),
            })),
          ).toEqual(history);
        }
      }
    };

    expected[key] = [bilateral(200), bilateral(210)];
    await submit(1, expected[key]);
    expected[key] = [...expected[key], ...unilateral(100), ...unilateral(105)];
    await submit(2, [...unilateral(100), ...unilateral(105)]);
    expected[key] = [...unilateral(100), ...unilateral(105), bilateral(220)];
    await submit(3, [bilateral(220)]);
    expected[key] = [bilateral(220), ...unilateral(110)];
    await submit(4, unilateral(110));

    // A different profile has its own latest workout for each mode.
    expected[profileKey] = [bilateral(300)];
    await submit(5, [bilateral(300)], profile.id);
    expected[profileKey] = [bilateral(300), ...unilateral(150)];
    await submit(6, unilateral(150), profile.id);

    // Upload order must not replace more recent history for either mode.
    await submit(1, [bilateral(50), ...unilateral(25)]);
  });
});
