import { expect, mock, test } from "bun:test";
import { Elysia } from "elysia";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../src/db/schema";

// Point this at a local test Postgres socket. Each run creates and drops its own database.
const socket = process.env.UPLIFTING_TEST_PG_SOCKET;

test.skipIf(!socket)(
  "fractional reps round-trip through sync, history, and workout edits",
  async () => {
    const admin = postgres({ host: socket, database: "postgres" });
    const database = `uplifting_test_${crypto.randomUUID().replaceAll("-", "")}`;
    await admin`CREATE DATABASE ${admin(database)}`;
    const sql = postgres({ host: socket, database, max: 1 });
    const db = drizzle(sql, { schema });
    try {
      await migrate(db, { migrationsFolder: `${import.meta.dir}/../drizzle` });
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
      const [user] = await db
        .insert(schema.users)
        .values({
          realName: "Test",
          username: "fractional-reps",
          email: "test@example.com",
          passwordHash: "unused",
        })
        .returning();
      const [exercise] = await db
        .insert(schema.exercises)
        .values({
          name: "Squat",
          exerciseType: "barbell",
        })
        .returning();

      mock.module("../src/db", () => ({ db, sql }));
      mock.module("../src/lib/auth", () => ({
        authPlugin: new Elysia().derive({ as: "scoped" }, () => ({ userId: user.id })),
      }));
      const { syncRoutes } = await import("../src/routes/sync");
      const { exerciseRoutes } = await import("../src/routes/exercises");
      const { workoutRoutes } = await import("../src/routes/workouts");
      const app = new Elysia().use(syncRoutes).use(exerciseRoutes).use(workoutRoutes);
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
    } finally {
      await sql.end();
      await admin`DROP DATABASE ${admin(database)}`;
      await admin.end();
    }
  },
);
