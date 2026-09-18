import { ExerciseAgentService } from "./service";
import { generateDraft } from "./provider";
export async function deliverNotification(service: ExerciseAgentService) {
  const sql = service.sql;
  // Taking a delivery lease before I/O allows multiple API instances to share this outbox.
  const [notice] =
    await sql`UPDATE exercise_agent_notifications SET attempts=attempts+1,available_at=now()+interval '2 minutes'
 WHERE id=(SELECT id FROM exercise_agent_notifications WHERE delivered_at IS NULL AND attempts<5 AND available_at<=now() ORDER BY available_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
  if (!notice) return;
  const tokens =
    await sql`SELECT p.token FROM exercise_agent_push_tokens p JOIN exercise_agent_sessions s ON s.user_id=p.user_id JOIN users u ON u.id=s.user_id
 WHERE s.id=${notice.session_id} AND s.revision=${notice.revision} AND s.status IN ('review','needs_input','failed') AND u.is_admin=true`;
  // A first request can finish while the device's permission dialog is still open.
  // Keep the bounded outbox retry window so subsequent token registration receives it.
  if (!tokens.length) return;
  try {
    // Keep content generic: a notification queued before logout may still arrive.
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EXPO_ACCESS_TOKEN
          ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(
        tokens.map((p) => ({
          to: p.token,
          title: "Uplifting",
          body: "Exercise draft updated",
          data: { session_id: notice.session_id },
          sound: "default",
          channelId: "exercise-agent",
        })),
      ),
    });
    if (!response.ok) throw new Error("Push rejected");
    const result = (await response.json()) as {
      data?: { status: string; details?: { error?: string } }[];
    };
    if (!Array.isArray(result.data) || result.data.length !== tokens.length)
      throw new Error("Invalid push response");
    let retry = false;
    for (let i = 0; i < tokens.length; i++) {
      const ticket = result.data[i];
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered")
        await sql`DELETE FROM exercise_agent_push_tokens WHERE token=${tokens[i].token}`;
      else if (ticket.status !== "ok") retry = true;
    }
    if (!retry)
      await sql`UPDATE exercise_agent_notifications SET delivered_at=now() WHERE id=${notice.id}`;
  } catch {
    // Retained outbox retries independently; never repeat generation to resend a notification.
    console.warn("Exercise notification delivery attempt failed");
  }
}
export function startExerciseWorker(service: ExerciseAgentService) {
  let stopped = false;
  const loop = async () => {
    while (!stopped) {
      try {
        if (process.env.OPENROUTER_API_KEY) {
          const job = await service.claim();
          if (job) {
            try {
              const input = await service.generationInput(job);
              const generated = await generateDraft(input);
              await service.finish(job, generated.result);
            } catch {
              await service.fail(job);
              console.warn("Exercise generation attempt failed");
            }
          }
        }
        await deliverNotification(service);
      } catch {
        console.warn("Exercise worker iteration failed");
      }
      await Bun.sleep(1000);
    }
  };
  void loop();
  return () => {
    stopped = true;
  };
}
