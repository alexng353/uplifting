import { test, expect } from "bun:test";
import { generateDraft } from "../src/exercise-agent/provider";
const input = {
  messages: [{ role: "user" as const, content: "Which press?" }],
  catalog: [],
  muscles: [{ name: "pectoralis major" }],
};
test("provider requests nonempty structured responses without search and returns validated clarification", async () => {
  const original = globalThis.fetch;
  let sent: any;
  globalThis.fetch = (async (_url, options) => {
    sent = JSON.parse(String(options?.body));
    return Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({
              kind: "clarification",
              message: "Which equipment?",
              draft: null,
            }),
          },
        },
      ],
      usage: { cost: 0.001 },
    });
  }) as typeof fetch;
  try {
    const result = await generateDraft(input, { apiKey: "test-only" });
    expect(sent.response_format.json_schema.schema.properties.message.minLength).toBe(1);
    expect(sent.max_tokens).toBe(4000);
    expect(sent.tools).toBeUndefined();
    expect(sent.plugins).toBeUndefined();
    expect(result.result.kind).toBe("clarification");
    expect(result.usage.cost).toBe(0.001);
  } finally {
    globalThis.fetch = original;
  }
});
test("provider never returns truncated proposals or includes upstream response bodies in errors", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = (async () =>
      Response.json({
        choices: [{ finish_reason: "length", message: { content: '{"kind":"draft"}' } }],
      })) as typeof fetch;
    await expect(generateDraft(input, { apiKey: "test-only" })).rejects.toThrow("did not finish");
    globalThis.fetch = (async () =>
      new Response("upstream private diagnostic", { status: 401 })) as typeof fetch;
    await expect(generateDraft(input, { apiKey: "test-only" })).rejects.toThrow(
      "Exercise provider returned HTTP 401",
    );
  } finally {
    globalThis.fetch = original;
  }
});
