import { test, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "../src/db/schema";
const socket = process.env.UPLIFTING_TEST_PG_SOCKET;
test.skipIf(!socket)(
  "HTTP requires real signed admin identity and owner for every draft operation",
  async () => {
    const admin = postgres({ host: socket, database: "postgres" });
    const database = "agent_http_" + crypto.randomUUID().replaceAll("-", "");
    await admin`CREATE DATABASE ${admin(database)}`;
    const sql = postgres({ host: socket, database, max: 3 });
    const db = drizzle(sql, { schema });
    try {
      await migrate(db, { migrationsFolder: import.meta.dir + "/../drizzle" });
      const users =
        await sql`INSERT INTO users(real_name,username,email,password_hash,is_admin) VALUES ('A','a','a@a','x',true),('B','b','b@b','x',true),('C','c','c@c','x',false) RETURNING id`;
      process.env.JWT_SECRET = "test-only-exercise-agent-secret";
      process.env.OPENROUTER_API_KEY = "test-not-used";
      mock.module("../src/db", () => ({ sql, db }));
      const { exerciseAgentRoutes } = await import("../src/routes/exercise-agent");
      const app = new Elysia().use(exerciseAgentRoutes);
      const signer = new Elysia()
        .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET }))
        .get("/token", ({ jwt }) => jwt.sign({ sub: users[0].id }));
      const token = await (await signer.handle(new Request("http://localhost/token"))).text();
      const request = (path: string, method = "GET", body?: unknown, auth = token) =>
        app.handle(
          new Request("http://localhost/exercise-agent" + path, {
            method,
            headers: {
              "Content-Type": "application/json",
              ...(auth ? { Authorization: "Bearer " + auth } : {}),
            },
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          }),
        );
      expect((await request("/", "GET", undefined, "")).status).toBe(401);
      expect((await request("/", "GET", undefined, "fake")).status).toBe(401);
      const createdResponse = await request("/", "POST", { message: "incline smith press" });
      expect(createdResponse.status).toBe(200);
      const created = await createdResponse.json();
      expect(created.status).toBe("queued");
      expect(created.lease_token).toBeUndefined();
      await sql`UPDATE exercise_agent_sessions SET user_id=${users[1].id} WHERE id=${created.id}`;
      for (const [suffix, method, body] of [
        ["", "GET", undefined],
        ["/approve", "POST", { revision: 1 }],
        ["/follow-up", "POST", { revision: 1, message: "test" }],
        ["/cancel", "POST", {}],
      ] as const)
        expect((await request("/" + created.id + suffix, method, body)).status).toBe(404);
      expect(
        (await request("/push-token", "PUT", { token: "ExpoPushToken[test_token]" })).status,
      ).toBe(200);
      expect((await request("/push-token", "PUT", { token: "bad" })).status).toBe(422);
      await sql`UPDATE users SET is_admin=false WHERE id=${users[0].id}`;
      for (const [path, method, body] of [
        ["/", "GET", undefined],
        ["/", "POST", { message: "test" }],
        ["/push-token", "PUT", { token: "ExpoPushToken[test_token]" }],
        ["/" + created.id, "GET", undefined],
        ["/" + created.id + "/cancel", "POST", {}],
      ] as const)
        expect((await request(path, method, body)).status).toBe(403);

      const child = Bun.spawn(["bun", "src/index.ts"], {
        cwd: import.meta.dir + "/..",
        env: {
          ...process.env,
          DATABASE_URL: `postgres:///${database}`,
          PGHOST: socket!,
          OPENROUTER_API_KEY: "",
          PORT: "0",
        },
        stdout: "pipe",
        stderr: "pipe",
      });
      const reader = child.stdout.getReader();
      try {
        const output = await Promise.race([
          reader.read(),
          Bun.sleep(5000).then(() => {
            throw new Error("API startup timed out");
          }),
        ]);
        if (!output.value?.length) throw new Error(await new Response(child.stderr).text());
        expect(new TextDecoder().decode(output.value)).toContain("Listening");
        child.kill("SIGTERM");
        const exit = await Promise.race([
          child.exited,
          Bun.sleep(12000).then(() => {
            throw new Error("API shutdown timed out");
          }),
        ]);
        expect(exit).toBe(0);
      } finally {
        child.kill();
        reader.releaseLock();
      }
    } finally {
      await sql.end();
      await admin`DROP DATABASE ${admin(database)}`;
      await admin.end();
    }
  },
  20000,
);
