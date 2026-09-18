import type postgres from "postgres";
import { validateResult, type Draft, type Message, type GenerationResult } from "./contract";
export class AgentError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export interface Session {
  id: string;
  user_id: string;
  status: string;
  revision: number;
  messages: (Message & { draft?: Draft | null })[];
  draft: Draft | null;
  error: string | null;
  exercise_id: string | null;
  lease_token: string | null;
  attempts: number;
  created_at: Date;
  updated_at: Date;
}
export class ExerciseAgentService {
  constructor(readonly sql: postgres.Sql) {}
  async assertAdmin(userId: string, tx: postgres.Sql | postgres.TransactionSql = this.sql) {
    const [u] = await tx`SELECT id FROM users WHERE id=${userId} AND is_admin=true`;
    if (!u) throw new AgentError("Admin access required", 403);
  }
  async get(userId: string, id: string) {
    await this.assertAdmin(userId);
    const [s] = await this.sql<
      Session[]
    >`SELECT * FROM exercise_agent_sessions WHERE id=${id} AND user_id=${userId}`;
    if (!s) throw new AgentError("Session not found", 404);
    return s;
  }
  async list(userId: string) {
    await this.assertAdmin(userId);
    return this.sql<
      Session[]
    >`SELECT * FROM exercise_agent_sessions WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 100`;
  }
  async create(userId: string, message: string) {
    this.checkMessage(message);
    return this.sql.begin(async (tx) => {
      await this.assertAdmin(userId, tx);
      await tx`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
      const [counts] =
        await tx`SELECT count(*) FILTER (WHERE status IN ('queued','running')) AS active, count(*) FILTER (WHERE created_at>now()-interval '1 day') AS daily FROM exercise_agent_sessions WHERE user_id=${userId}`;
      if (Number(counts.active) >= 3 || Number(counts.daily) >= 30)
        throw new AgentError("Exercise request limit reached", 429);
      const [s] = await tx<
        Session[]
      >`INSERT INTO exercise_agent_sessions(user_id,messages) VALUES (${userId},${JSON.stringify([{ role: "user", content: message.trim() }])}) RETURNING *`;
      return s;
    });
  }
  checkMessage(message: string) {
    if (typeof message !== "string" || !message.trim() || message.length > 4000)
      throw new AgentError("Enter an exercise request of 1–4000 characters");
  }
  async followUp(userId: string, id: string, revision: number, message: string) {
    this.checkMessage(message);
    return this.sql.begin(async (tx) => {
      await this.assertAdmin(userId, tx);
      await tx`SELECT id FROM users WHERE id=${userId} FOR UPDATE`;
      const [s] = await tx<
        Session[]
      >`SELECT * FROM exercise_agent_sessions WHERE id=${id} AND user_id=${userId} FOR UPDATE`;
      if (!s) throw new AgentError("Session not found", 404);
      if (s.revision !== revision || !["review", "needs_input", "failed"].includes(s.status))
        throw new AgentError("Session changed; refresh before continuing", 409);
      const [active] =
        await tx`SELECT count(*) AS count FROM exercise_agent_sessions WHERE user_id=${userId} AND status IN ('queued','running')`;
      if (Number(active.count) >= 3) throw new AgentError("Exercise request limit reached", 429);
      if (s.revision >= 20) throw new AgentError("Session follow-up limit reached", 429);
      const [updated] = await tx<
        Session[]
      >`UPDATE exercise_agent_sessions SET status='queued',revision=revision+1,messages=${JSON.stringify([...s.messages, { role: "user", content: message.trim() }])},draft=null,error=null,attempts=0,available_at=now(),lease_token=null,lease_until=null,updated_at=now() WHERE id=${id} RETURNING *`;
      return updated;
    });
  }
  async cancel(userId: string, id: string) {
    await this.assertAdmin(userId);
    const [s] = await this.sql<
      Session[]
    >`UPDATE exercise_agent_sessions SET status='cancelled',lease_token=null,lease_until=null,updated_at=now() WHERE id=${id} AND user_id=${userId} AND status<>'approved' RETURNING *`;
    if (!s) {
      const existing = await this.get(userId, id);
      if (existing.status === "approved")
        throw new AgentError("Approved exercises cannot be cancelled", 409);
    }
    return s;
  }
  async approve(userId: string, id: string, revision: number) {
    return this.sql.begin(async (tx) => {
      await this.assertAdmin(userId, tx);
      const [s] = await tx<
        Session[]
      >`SELECT * FROM exercise_agent_sessions WHERE id=${id} AND user_id=${userId} FOR UPDATE`;
      if (!s) throw new AgentError("Session not found", 404);
      if (s.revision !== revision)
        throw new AgentError("Draft changed; review the latest revision", 409);
      if (s.status === "approved") return s;
      if (s.status !== "review" || !s.draft)
        throw new AgentError("Draft is not ready for approval", 409);
      const muscles = await tx<{ id: string; name: string }[]>`SELECT id,name FROM muscles`;
      const d = validateResult(
        { kind: "draft", message: "Approve", draft: s.draft },
        muscles,
      ).draft!;
      // Serialize catalog insertion with the legacy admin endpoint as well.
      await tx`LOCK TABLE exercises IN SHARE ROW EXCLUSIVE MODE`;
      const [duplicate] =
        await tx`SELECT id FROM exercises WHERE lower(trim(name))=lower(${d.name}) AND official=true`;
      if (duplicate)
        throw new AgentError("An official exercise with this name already exists", 409);
      const [e] =
        await tx`INSERT INTO exercises(name,exercise_type,official,author_id,description,movement_pattern,muscle_group)
    VALUES (${d.name},${d.exercise_type},true,${userId},${d.description},${d.movement_pattern},${d.muscle_group}) RETURNING id`;
      for (const m of muscles) {
        if (d.primary_muscles.includes(m.name) || d.secondary_muscles.includes(m.name))
          await tx`INSERT INTO exercise_muscle_relations(exercise_id,muscle_id,is_primary) VALUES (${e.id},${m.id},${d.primary_muscles.includes(m.name)})`;
      }
      const [updated] = await tx<
        Session[]
      >`UPDATE exercise_agent_sessions SET status='approved',exercise_id=${e.id},updated_at=now() WHERE id=${id} RETURNING *`;
      return updated;
    });
  }
  async claim(): Promise<Session | undefined> {
    // A crashed worker gets at most three attempts; expired final leases become visible failures.
    await this.sql.begin(async (tx) => {
      const expired =
        await tx`UPDATE exercise_agent_sessions SET status='failed',error='Generation interrupted. Send a follow-up to retry.',lease_token=null,lease_until=null,updated_at=now()
    WHERE status='running' AND lease_until<now() AND attempts>=3 RETURNING id,revision`;
      for (const s of expired)
        await tx`INSERT INTO exercise_agent_notifications(session_id,revision) VALUES (${s.id},${s.revision}) ON CONFLICT DO NOTHING`;
    });
    const [job] = await this.sql<
      Session[]
    >`UPDATE exercise_agent_sessions SET status='running',lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',attempts=attempts+1,updated_at=now()
   WHERE id=(SELECT s.id FROM exercise_agent_sessions s JOIN users u ON u.id=s.user_id AND u.is_admin=true
    WHERE ((s.status='queued' AND s.available_at<=now()) OR (s.status='running' AND s.lease_until<now())) AND s.attempts<3
    ORDER BY s.created_at FOR UPDATE OF s SKIP LOCKED LIMIT 1) RETURNING *`;
    return job;
  }
  async generationInput(job: Session) {
    await this.assertAdmin(job.user_id);
    const catalog = await this.sql<
      { id: string; name: string; exercise_type: string }[]
    >`SELECT id,name,exercise_type FROM exercises WHERE official=true ORDER BY name`;
    const muscles = await this.sql<{ name: string }[]>`SELECT name FROM muscles ORDER BY name`;
    return {
      messages: job.messages.map(({ role, content, draft }) => ({
        role,
        content: content + (draft ? "\n" + JSON.stringify(draft) : ""),
      })),
      catalog,
      muscles,
    };
  }
  async finish(job: Session, result: GenerationResult) {
    return this.sql.begin(async (tx) => {
      const muscles = await tx<{ name: string }[]>`SELECT name FROM muscles`;
      const valid = validateResult(result, muscles);
      const messages = [
        ...job.messages,
        {
          role: "assistant",
          content: valid.message,
          draft: valid.draft,
        },
      ];
      const [s] =
        await tx`UPDATE exercise_agent_sessions SET status=${valid.kind === "draft" ? "review" : "needs_input"},messages=${JSON.stringify(messages)},draft=${valid.draft ? JSON.stringify(valid.draft) : null},error=null,lease_token=null,lease_until=null,updated_at=now()
    WHERE id=${job.id} AND revision=${job.revision} AND status='running' AND lease_token=${job.lease_token} AND EXISTS(SELECT 1 FROM users WHERE id=${job.user_id} AND is_admin=true) RETURNING id,revision`;
      if (s)
        await tx`INSERT INTO exercise_agent_notifications(session_id,revision) VALUES (${s.id},${s.revision}) ON CONFLICT DO NOTHING`;
    });
  }
  async fail(job: Session) {
    await this.sql.begin(async (tx) => {
      const final = job.attempts >= 3;
      const [s] =
        await tx`UPDATE exercise_agent_sessions SET status=${final ? "failed" : "queued"},error=${final ? "Generation failed. Send a follow-up to retry." : null},lease_token=null,lease_until=null,available_at=now()+interval '10 seconds',updated_at=now()
    WHERE id=${job.id} AND revision=${job.revision} AND status='running' AND lease_token=${job.lease_token} RETURNING id,revision`;
      if (s && final)
        await tx`INSERT INTO exercise_agent_notifications(session_id,revision) VALUES (${s.id},${s.revision}) ON CONFLICT DO NOTHING`;
    });
  }
}
export function publicSession(s: Session) {
  const { lease_token: _lease, attempts: _attempts, user_id: _owner, ...result } = s;
  // Explicit response fields prevent worker metadata leaking through future columns.
  return {
    id: result.id,
    status: result.status,
    revision: result.revision,
    messages: result.messages.map(({ role, content }) => ({ role, content })),
    draft: result.draft,
    error: result.error,
    exercise_id: result.exercise_id,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
}
