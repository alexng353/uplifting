export type AgentStatus =
  | "queued"
  | "running"
  | "review"
  | "needs_input"
  | "approved"
  | "cancelled"
  | "failed";

export function isGenerating(status: string) {
  return status === "queued" || status === "running";
}

export function canFollowUp(status: string) {
  return status === "review" || status === "needs_input" || status === "failed";
}

export function notificationSessionId(data: Record<string, unknown>): string | null {
  const id = data.session_id;
  return typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ? id
    : null;
}
