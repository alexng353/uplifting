import { test, expect } from "bun:test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { deliverNotification } from "../src/exercise-agent/worker";
import { ExerciseAgentService, publicSession } from "../src/exercise-agent/service";
const socket = process.env.UPLIFTING_TEST_PG_SOCKET;
test.skipIf(!socket)(
  "draft lifecycle enforces owner, revision, cancellation and one publication",
  async () => {
    const admin = postgres({ host: socket, database: "postgres" });
    const database = "agent_" + crypto.randomUUID().replaceAll("-", "");
    await admin`CREATE DATABASE ${admin(database)}`;
    const sql = postgres({ host: socket, database, max: 4 });
    try {
      await migrate(drizzle(sql), { migrationsFolder: import.meta.dir + "/../drizzle" });
      const [user, other] =
        await sql`INSERT INTO users(real_name,username,email,password_hash,is_admin) VALUES ('A','a','a@a','x',true),('B','b','b@b','x',true) RETURNING id`;
      await sql`INSERT INTO muscles(name,minor_group) VALUES ('pectoralis major','chest')`;
      const service = new ExerciseAgentService(sql);
      const draft = {
        name: "Incline Smith Machine Bench Press",
        exercise_type: "machine",
        description: "Incline press",
        movement_pattern: "horizontal_push",
        muscle_group: "chest",
        primary_muscles: ["pectoralis major"],
        secondary_muscles: [],
      };
      const created = await service.create(user.id, "incline smith bench");
      expect(created.status).toBe("queued");
      await expect(service.get(other.id, created.id)).rejects.toThrow();
      await expect(service.approve(user.id, created.id, 1)).rejects.toThrow();
      const job = await service.claim();
      expect(job.id).toBe(created.id);
      await service.finish(job, { kind: "draft", message: "Ready", draft });
      expect((await service.get(user.id, created.id)).status).toBe("review");
      const reviewed = await service.get(user.id, created.id);
      expect(publicSession(reviewed).messages.at(-1)?.content).toBe("Ready");
      expect((await service.generationInput(reviewed)).messages.at(-1)?.content).toContain(
        "Incline Smith",
      );
      await service.followUp(user.id, created.id, 1, "Please keep incline");
      await expect(service.approve(user.id, created.id, 1)).rejects.toThrow();
      const job2 = await service.claim();
      await service.finish(job, { kind: "draft", message: "stale", draft });
      expect((await service.get(user.id, created.id)).status).toBe("running");
      await service.finish(job2, { kind: "draft", message: "Ready", draft });
      const approvals = await Promise.all([
        service.approve(user.id, created.id, 2),
        service.approve(user.id, created.id, 2),
      ]);
      expect(approvals[0].exercise_id).toBe(approvals[1].exercise_id);
      expect(Number((await sql`SELECT count(*) FROM exercises`)[0].count)).toBe(1);
      const cancelled = await service.create(user.id, "new exercise");
      const job3 = await service.claim();
      await service.cancel(user.id, cancelled.id);
      await service.finish(job3, { kind: "draft", message: "late", draft });
      expect((await service.get(user.id, cancelled.id)).status).toBe("cancelled");
      const restart = await service.create(user.id, "another exercise");
      const old = await service.claim();
      await sql`UPDATE exercise_agent_sessions SET lease_until=now()-interval '1 second' WHERE id=${restart.id}`;
      const reclaimed = await service.claim();
      expect(reclaimed.lease_token).not.toBe(old.lease_token);
      await service.finish(old, { kind: "draft", message: "late old lease", draft });
      expect((await service.get(user.id, restart.id)).status).toBe("running");
      await service.finish(reclaimed, {
        kind: "clarification",
        message: "Which equipment?",
        draft: null,
      });
      expect((await service.get(user.id, restart.id)).status).toBe("needs_input");
      const active = await Promise.all([
        service.create(user.id, "one"),
        service.create(user.id, "two"),
        service.create(user.id, "three"),
      ]);
      await expect(service.followUp(user.id, restart.id, 1, "try again")).rejects.toThrow("limit");
      for (const item of active) await service.cancel(user.id, item.id);
      const duplicate = await service.create(user.id, "same exercise");
      const duplicateJob = await service.claim();
      await service.finish(duplicateJob!, { kind: "draft", message: "Ready", draft });
      await expect(service.approve(user.id, duplicate.id, 1)).rejects.toThrow("already exists");
      expect(Number((await sql`SELECT count(*) FROM exercises`)[0].count)).toBe(1);
      const failure = await service.create(user.id, "failure");
      for (let attempt = 0; attempt < 3; attempt++) {
        const failedJob = await service.claim();
        await service.fail(failedJob!);
        await sql`UPDATE exercise_agent_sessions SET available_at=now()-interval '1 second' WHERE id=${failure.id}`;
      }
      expect((await service.get(user.id, failure.id)).status).toBe("failed");
      expect(
        Number(
          (
            await sql`SELECT count(*) FROM exercise_agent_notifications WHERE session_id=${failure.id}`
          )[0].count,
        ),
      ).toBe(1);
      await sql`UPDATE exercise_agent_notifications SET delivered_at=now() WHERE session_id<>${failure.id}`;
      await deliverNotification(service);
      expect(
        (
          await sql`SELECT delivered_at FROM exercise_agent_notifications WHERE session_id=${failure.id}`
        )[0].delivered_at,
      ).toBeNull();
      await sql`UPDATE exercise_agent_notifications SET available_at=now() WHERE session_id=${failure.id}`;
      await sql`INSERT INTO exercise_agent_push_tokens(token,user_id) VALUES ('ExpoPushToken[test]',${user.id})`;
      const originalFetch = globalThis.fetch;
      let sent: any;
      globalThis.fetch = (async (_url, options) => {
        sent = JSON.parse(String(options?.body));
        return Response.json({ data: [{ status: "ok", id: "ticket" }] });
      }) as typeof fetch;
      try {
        await deliverNotification(service);
      } finally {
        globalThis.fetch = originalFetch;
      }
      expect(sent[0].body).toBe("Exercise draft updated");
      expect(sent[0].data.session_id).toBe(failure.id);
      expect(
        (
          await sql`SELECT delivered_at FROM exercise_agent_notifications WHERE session_id=${failure.id}`
        )[0].delivered_at,
      ).not.toBeNull();
      await sql`UPDATE users SET is_admin=false WHERE id=${user.id}`;
      await expect(service.create(user.id, "test")).rejects.toThrow();
    } finally {
      await sql.end();
      await admin`DROP DATABASE ${admin(database)}`;
      await admin.end();
    }
  },
);
