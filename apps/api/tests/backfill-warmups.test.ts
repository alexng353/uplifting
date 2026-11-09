import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { CANDIDATES } from "../src/db/backfill-warmups";

const socket = process.env.UPLIFTING_TEST_PG_SOCKET;

describe.skipIf(!socket)("warmup backfill", () => {
  const admin = postgres({ host: socket, database: "postgres" });
  const database = `uplifting_test_${crypto.randomUUID().replaceAll("-", "")}`;
  const sql = postgres({ host: socket, database, max: 1 });
  let user: string;
  const ex: Record<string, string> = {};
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    await admin`CREATE DATABASE ${admin(database)}`;
    await migrate(drizzle(sql), { migrationsFolder: `${import.meta.dir}/../drizzle` });
    user = (
      await sql`INSERT INTO users (real_name, username, email, password_hash)
        VALUES ('A', 'alex', 'a@example.com', 'x') RETURNING id`
    )[0].id;
    for (const [name, type] of [
      ["Chest", "machine"],
      ["Curl", "machine"],
      ["Pullup", "bodyweight"],
      ["Flagged", "machine"],
    ])
      ex[name] = (
        await sql`INSERT INTO exercises (name, exercise_type) VALUES (${name}, ${type}) RETURNING id`
      )[0].id;
    const [w] = await sql`INSERT INTO workouts (user_id, start_time, end_time, privacy, kind)
      VALUES (${user}, now(), now(), 'friends', 'workout') RETURNING id`;
    let t = 0;
    const add = async (
      key: string,
      e: string,
      weight: number,
      side: string | null = null,
      warm = false,
    ) => {
      ids[key] = (
        await sql`INSERT INTO user_sets (user_id, exercise_id, workout_id, reps, weight, weight_unit, side, is_warmup, created_at)
          VALUES (${user}, ${ex[e]}, ${w.id}, 6, ${weight}, 'lbs', ${side}, ${warm}, now() + ${`${t++} seconds`}::interval) RETURNING id`
      )[0].id;
    };
    // Alex's chest press: 100 then 200, 200. 100 is a warmup.
    await add("c1", "Chest", 100);
    await add("c2", "Chest", 200);
    await add("c3", "Chest", 200);
    // Preacher curl per side: 25 R/L then 45 R/L. Bilateral 30 in the same session is its own mode.
    await add("p1", "Curl", 25, "R");
    await add("p2", "Curl", 25, "L");
    await add("p3", "Curl", 45, "R");
    await add("p4", "Curl", 45, "L");
    await add("pb", "Curl", 30);
    // A heavier back-off later stays working; bodyweight and already-flagged sessions are skipped.
    await add("b1", "Pullup", 0);
    await add("b2", "Pullup", 25);
    await add("f1", "Flagged", 50, null, true);
    await add("f2", "Flagged", 40);
    await add("f3", "Flagged", 100);
  });

  afterAll(async () => {
    await sql.end();
    await admin`DROP DATABASE IF EXISTS ${admin(database)}`;
    await admin.end();
  });

  test("marks only sets before the session's 80% line, per mode", async () => {
    const found = new Set((await sql.unsafe(CANDIDATES)).map((r) => r.id));
    const marked = Object.keys(ids)
      .filter((k) => found.has(ids[k]))
      .sort();
    expect(marked).toEqual(["c1", "p1", "p2"]);
  });
});
