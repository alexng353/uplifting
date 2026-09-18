import { describe, expect, test } from "bun:test";
import {
  canFollowUp,
  isGenerating,
  notificationSessionId,
  type AgentStatus,
} from "./exercise-agent";

describe("exercise draft actions", () => {
  test("only queued/running revisions poll as generation", () => {
    const statuses: AgentStatus[] = [
      "queued",
      "running",
      "review",
      "needs_input",
      "approved",
      "cancelled",
      "failed",
    ];
    expect(statuses.filter(isGenerating)).toEqual(["queued", "running"]);
    expect(statuses.filter(canFollowUp)).toEqual(["review", "needs_input", "failed"]);
  });
  test("notification routing accepts a session UUID, never an arbitrary URL", () => {
    const id = "019a923c-3c57-7000-b39d-cdc278c08af6";
    expect(notificationSessionId({ session_id: id })).toBe(id);
    for (const value of ["https://evil.example", "../settings", "", undefined, 5]) {
      expect(notificationSessionId({ session_id: value })).toBeNull();
    }
    expect(notificationSessionId({ url: "/login" })).toBeNull();
  });
});
