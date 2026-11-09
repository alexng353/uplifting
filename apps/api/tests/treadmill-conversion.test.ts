import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const socket = process.env.UPLIFTING_TEST_PG_SOCKET;
const dir = `${import.meta.dir}/../drizzle`;
const file = readdirSync(dir).find((f) => f.includes("convert_treadmill_workaround"))!;
const NOV6 = "2026-11-06T22:30:00Z";

describe.skipIf(!socket)("Nov 6 treadmill conversion", () => {
  const admin = postgres({ host: socket, database: "postgres" });
  const database = `uplifting_test_${crypto.randomUUID().replaceAll("-", "")}`;
  const sql = postgres({ host: socket, database, max: 1 });
  let alex: string;
  let other: string;
  let walk: string;
  let curl: string;

  beforeAll(async () => {
    await admin`CREATE DATABASE ${admin(database)}`;
    await migrate(drizzle(sql), { migrationsFolder: dir });
    const user = async (name: string) =>
      (
        await sql`INSERT INTO users (real_name, username, email, password_hash)
          VALUES (${name}, ${name}, ${`${name}@example.com`}, 'x') RETURNING id`
      )[0].id as string;
    alex = await user("alex");
    other = await user("other");
    walk = (await sql`SELECT id FROM exercises WHERE name = 'Reverse Incline Treadmill Walk'`)[0]
      .id;
    curl = (
      await sql`INSERT INTO exercises (name, exercise_type) VALUES ('Curl', 'dumbbell') RETURNING id`
    )[0].id;
  });

  afterAll(async () => {
    await sql.end();
    await admin`DROP DATABASE IF EXISTS ${admin(database)}`;
    await admin.end();
  });

  beforeEach(async () => {
    await sql`DELETE FROM user_sets`;
    await sql`DELETE FROM workouts`;
    await sql`DROP TABLE IF EXISTS set_conversion_backup`;
  });

  const addSet = async (
    user: string,
    exercise: string,
    reps: number,
    weight: number,
    at = NOV6,
  ) => {
    const [w] = await sql`INSERT INTO workouts (user_id, start_time, end_time, privacy, kind)
      VALUES (${user}, ${at}::timestamptz, ${at}::timestamptz, 'friends', 'workout') RETURNING id`;
    const [s] =
      await sql`INSERT INTO user_sets (user_id, exercise_id, workout_id, reps, weight, weight_unit)
      VALUES (${user}, ${exercise}, ${w.id}, ${reps}, ${weight}, 'lbs') RETURNING id`;
    return s.id as string;
  };
  const run = async () => {
    const text = await Bun.file(`${dir}/${file}`).text();
    for (const st of text.split("--> statement-breakpoint")) await sql.unsafe(st);
  };
  const row = async (id: string) => (await sql`SELECT * FROM user_sets WHERE id = ${id}`)[0];

  test("converts the one matching set, backs it up, and a re-run changes nothing", async () => {
    const target = await addSet(alex, walk, 10, 0);
    const curlSet = await addSet(alex, curl, 10, 0);
    const otherUser = await addSet(other, walk, 10, 0);
    const otherDay = await addSet(alex, walk, 10, 0, "2026-11-03T22:30:00Z");
    await run();
    const after = await row(target);
    expect(Number(after.reps)).toBe(1);
    expect(after.duration_seconds).toBe(600);
    expect(Number(after.speed)).toBe(3.5);
    expect(after.speed_unit).toBe("mph");
    expect(Number(after.incline)).toBe(3.5);
    const backup = await sql`SELECT * FROM set_conversion_backup`;
    expect(backup.map((b) => [b.id, Number(b.reps), b.duration_seconds])).toEqual([
      [target, 10, null],
    ]);
    for (const id of [curlSet, otherUser, otherDay]) {
      const r = await row(id);
      expect([Number(r.reps), r.duration_seconds]).toEqual([10, null]);
    }
    await run();
    expect(await sql`SELECT * FROM set_conversion_backup`).toHaveLength(1);
  });

  test("does nothing with no match or with more than one match", async () => {
    await run();
    expect(await sql`SELECT * FROM set_conversion_backup`).toHaveLength(0);
    const a = await addSet(alex, walk, 10, 0);
    const b = await addSet(alex, walk, 10, 0);
    await run();
    expect(await sql`SELECT * FROM set_conversion_backup`).toHaveLength(0);
    for (const id of [a, b]) expect((await row(id)).duration_seconds).toBeNull();
  });
});
