/**
 * Shared plumbing for the MCP tools: the per-request auth context, scope-gated
 * registration, response shaping, and the training-math helpers the tools use
 * to describe a workout the way a lifter would.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Scope } from "../lib/oauth/config";

/** Cap on a single tool response, so one broad query can't eat the context window. */
export const CHARACTER_LIMIT = 25_000;

/** Who the caller is, resolved from the bearer token on this HTTP request. */
export interface McpContext {
  userId: string;
  clientId: string;
  scopes: ReadonlySet<Scope>;
}

export function hasScope(ctx: McpContext, scope: Scope): boolean {
  return ctx.scopes.has(scope);
}

/**
 * Register a tool only when the access token carries the scope it needs.
 *
 * Filtering at registration rather than at call time means `tools/list`
 * already reflects what this token can do, so the model never sees a tool it
 * would only be refused for using.
 */
export function scopedTool<Args extends z.ZodRawShape>(
  server: McpServer,
  ctx: McpContext,
  scope: Scope,
  name: string,
  config: {
    title: string;
    description: string;
    inputSchema?: Args;
    annotations?: {
      readOnlyHint?: boolean;
      destructiveHint?: boolean;
      idempotentHint?: boolean;
      openWorldHint?: boolean;
    };
  },
  handler: (args: z.objectOutputType<Args, z.ZodTypeAny>) => Promise<CallToolResult>,
): void {
  if (!hasScope(ctx, scope)) return;

  server.registerTool(
    name,
    config as never,
    (async (args: unknown) => {
      try {
        return await handler(args as z.objectOutputType<Args, z.ZodTypeAny>);
      } catch (error) {
        return toolError(describeError(error));
      }
    }) as never,
  );
}

// ── Response shaping ───────────────────────────────────────────────────────

export const responseFormatSchema = z
  .enum(["markdown", "json"])
  .default("markdown")
  .describe("Output format: 'markdown' for a readable summary, 'json' for the raw structure");

export type ResponseFormat = "markdown" | "json";

/**
 * Build a tool result. `structuredContent` always carries the full object;
 * the text block is either a readable rendering or the same JSON, depending on
 * what the caller asked for.
 */
export function respond(
  format: ResponseFormat,
  markdown: string,
  structured: object,
): CallToolResult {
  const text = format === "json" ? JSON.stringify(structured, null, 2) : markdown;
  return {
    content: [{ type: "text", text: truncate(text) }],
    structuredContent: structured as Record<string, unknown>,
  };
}

export function toolError(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}

function truncate(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return `${text.slice(0, CHARACTER_LIMIT)}\n\n[Response truncated at ${CHARACTER_LIMIT} characters. Narrow the query — use a smaller 'limit', a date range, or a specific exercise.]`;
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  // Postgres surfaces bad UUIDs as a syntax error; the raw text is useless to a model.
  if (/invalid input syntax for type uuid/i.test(message)) {
    return "Error: one of the IDs was not a valid UUID. IDs come from other tool results — don't invent them.";
  }
  if (/violates foreign key constraint/i.test(message)) {
    return "Error: referenced a record that does not exist. Check the exercise, workout or gym ID and try again.";
  }
  return `Error: ${message}`;
}

// ── Pagination ─────────────────────────────────────────────────────────────

export const paginationSchema = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum number of items to return (1-100)"),
  offset: z.number().int().min(0).default(0).describe("Number of items to skip, for paging"),
};

export interface Page<T> {
  total: number;
  count: number;
  offset: number;
  items: T[];
  has_more: boolean;
  next_offset?: number;
}

export function paginate<T>(items: T[], total: number, offset: number): Page<T> {
  const hasMore = total > offset + items.length;
  return {
    total,
    count: items.length,
    offset,
    items,
    has_more: hasMore,
    ...(hasMore ? { next_offset: offset + items.length } : {}),
  };
}

// ── Training math ──────────────────────────────────────────────────────────

const LBS_TO_KG = 0.453592;

export function toKg(weight: number, unit: string): number {
  return unit === "lbs" ? weight * LBS_TO_KG : weight;
}

/**
 * Epley estimated one-rep max. Used to compare sets across different rep
 * ranges — a heavy triple and a lighter set of ten become one number.
 */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function formatWeight(weight: number, unit: string): string {
  return `${round(weight)}${unit}`;
}

/** e.g. `100kg × 5` , or `100kg × 5 (L)` for one side of a unilateral set. */
export function formatSet(set: {
  reps: number;
  weight: number;
  weight_unit: string;
  side?: string | null;
}): string {
  const side = set.side ? ` (${set.side})` : "";
  return `${formatWeight(set.weight, set.weight_unit)} × ${set.reps}${side}`;
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString();
}

/** Parses an ISO date or date-time, returning null when the input is unusable. */
export function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const isoDateSchema = z
  .string()
  .describe("ISO 8601 date or date-time, e.g. '2026-03-14' or '2026-03-14T18:30:00Z'");

export const weightUnitSchema = z
  .enum(["kg", "lbs"])
  .default("kg")
  .describe("Unit the weight is expressed in");
