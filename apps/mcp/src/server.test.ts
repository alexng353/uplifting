import { describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readConfig } from "./server";

const id = "123e4567-e89b-42d3-a456-426614174000";

describe("configuration", () => {
  test("requires explicit credentials and a safe origin", () => {
    for (const url of [
      undefined,
      "http://example.com",
      "https://user:pass@example.com",
      "https://example.com/path",
      "https://example.com?token=secret",
      "invalid",
    ]) {
      expect(() =>
        readConfig({ UPLIFTING_API_URL: url, UPLIFTING_ACCESS_TOKEN: "secret" }),
      ).toThrow();
    }
    expect(() => readConfig({ UPLIFTING_API_URL: "https://example.com" })).toThrow();
    expect(
      readConfig({ UPLIFTING_API_URL: "http://localhost:8080", UPLIFTING_ACCESS_TOKEN: "secret" })
        .origin,
    ).toBe("http://localhost:8080");
  });
});

test("real stdio SDK calls forward all six tools and contain HTTP errors", async () => {
  const requests: { method: string; path: string; authorization: string | null; body: unknown }[] =
    [];
  let status = 200;
  const api = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(req) {
      requests.push({
        method: req.method,
        path: new URL(req.url).pathname,
        authorization: req.headers.get("authorization"),
        body: req.method === "POST" ? await req.json() : null,
      });
      return Response.json(
        { status: "pending", echoed: "test-secret" },
        { status, headers: status === 302 ? { Location: "/credential-leak" } : {} },
      );
    },
  });
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [new URL("./index.ts", import.meta.url).pathname],
    env: {
      UPLIFTING_API_URL: `http://127.0.0.1:${api.port}`,
      UPLIFTING_ACCESS_TOKEN: "test-secret",
    },
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(6);
    expect(tools.find((tool) => tool.name === "exercise_agent_approve")?.description).toContain(
      "explicitly approves the exact proposal revision",
    );
    const calls = [
      ["create", { message: "Add a squat" }, "POST", "", { message: "Add a squat" }],
      ["list", {}, "GET", "", null],
      ["get", { id }, "GET", `/${id}`, null],
      [
        "follow_up",
        { id, message: "Use barbell", revision: 1 },
        "POST",
        `/${id}/follow-up`,
        { message: "Use barbell", revision: 1 },
      ],
      ["approve", { id, revision: 2 }, "POST", `/${id}/approve`, { revision: 2 }],
      ["cancel", { id }, "POST", `/${id}/cancel`, {}],
    ] as const;
    for (const [name, args, method, path, body] of calls) {
      const result = await client.callTool({ name: `exercise_agent_${name}`, arguments: args });
      expect(result.isError).not.toBe(true);
      expect(JSON.stringify(result)).not.toContain("test-secret");
      expect(requests.at(-1)).toEqual({
        method,
        path: `/api/v1/exercise-agent${path}`,
        authorization: "Bearer test-secret",
        body,
      });
    }
    const count = requests.length;
    const invalid = await client.callTool({
      name: "exercise_agent_approve",
      arguments: { id, revision: 1.5 },
    });
    expect(invalid.isError).toBe(true);
    expect(requests).toHaveLength(count);
    for (const code of [401, 403, 409, 500, 302]) {
      status = code;
      const result = await client.callTool({ name: "exercise_agent_get", arguments: { id } });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result)).not.toContain("test-secret");
    }
    expect(requests.some((request) => request.path === "/credential-leak")).toBe(false);
  } finally {
    await client.close();
    api.stop(true);
  }
});
