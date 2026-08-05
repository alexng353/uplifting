/**
 * Builds the MCP server for one authenticated request.
 *
 * A fresh `McpServer` per request is deliberate. The context — user, client,
 * granted scopes — is captured in the tool closures, so a tool can never read
 * another user's data, and `tools/list` already reflects the scopes on the
 * token that asked. It also keeps the transport stateless, which is what lets
 * this run behind an ordinary load balancer.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPrompts } from "./prompts";
import { registerResources } from "./resources";
import type { McpContext } from "./shared";
import { registerAnalyticsTools } from "./tools/analytics";
import { registerExerciseTools } from "./tools/exercises";
import { registerProfileTools, registerSocialTools } from "./tools/profile";
import { registerWorkoutTools } from "./tools/workouts";

export const SERVER_NAME = "uplifting-mcp-server";
export const SERVER_VERSION = "1.0.0";

const INSTRUCTIONS = `Uplifting is the user's personal strength-training log.

Use these tools to answer questions about what they have actually trained and to record new sessions. Everything is scoped to the signed-in user.

Working rules:
- Resolve exercises with uplifting_search_exercises before logging; exercise IDs are stable, names are not.
- Weights are stored per set in kg or lbs. Aggregate figures ("volume") are always normalised to kg.
- Unilateral work is stored as one row per side. Set counts follow the app and count a left/right pair once; volume counts both.
- Estimated 1RM uses the Epley formula, so sets at different rep ranges can be compared.
- Confirm with the user before deleting a workout or set — those tools are not reversible.
- Ground every claim about progress in tool results. If the log is too sparse to support a conclusion, say so.`;

export function createMcpServer(ctx: McpContext): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  );

  registerWorkoutTools(server, ctx);
  registerExerciseTools(server, ctx);
  registerAnalyticsTools(server, ctx);
  registerProfileTools(server, ctx);
  registerSocialTools(server, ctx);
  registerResources(server, ctx);
  registerPrompts(server, ctx);

  return server;
}
