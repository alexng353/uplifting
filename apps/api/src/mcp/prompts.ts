/**
 * MCP prompts — starting points a user can pick from the client's prompt menu.
 *
 * Each one is written as an instruction to the assistant that names the tools
 * worth reaching for, so the model doesn't have to rediscover the workflow.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { type McpContext, hasScope } from "./shared";

function userMessage(text: string): GetPromptResult {
  return { messages: [{ role: "user", content: { type: "text", text } }] };
}

/**
 * Thin wrapper over `registerPrompt`.
 *
 * Prompt arguments always arrive as strings over the wire, so they are typed
 * that way here. Going through the SDK's generic inference instead makes the
 * compiler chase the zod-3/zod-4 compatibility union until it gives up with
 * "type instantiation is excessively deep".
 */
function definePrompt(
  server: McpServer,
  name: string,
  config: { title: string; description: string; argsSchema?: Record<string, z.ZodType> },
  handler: (args: Record<string, string | undefined>) => GetPromptResult,
): void {
  server.registerPrompt(name, config as never, handler as never);
}

export function registerPrompts(server: McpServer, ctx: McpContext): void {
  if (hasScope(ctx, "workouts:read")) {
    definePrompt(
      server,
      "analyze_progress",
      {
        title: "Analyse my progress",
        description:
          "Review recent training for a lift (or overall) and say whether it is actually progressing.",
        argsSchema: {
          exercise: z
            .string()
            .optional()
            .describe("Exercise to focus on, e.g. 'Bench Press'. Omit for an overall review."),
          weeks: z.string().optional().describe("How many weeks back to look (default 12)"),
        },
      },
      (args) => {
        const scope = args.exercise
          ? `my ${args.exercise}`
          : "my training overall, focusing on my main lifts";
        const weeks = args.weeks ?? "12";
        return userMessage(
          `Review ${scope} over the last ${weeks} weeks and tell me honestly whether I'm progressing.

Pull the data first — don't guess:
${args.exercise ? `- uplifting_get_exercise_history for ${args.exercise}` : "- uplifting_get_personal_records to find my main lifts, then uplifting_get_exercise_history for the top few"}
- uplifting_get_weekly_volume for the volume trend
- uplifting_get_training_stats for consistency and streaks

Then tell me: what's genuinely improving, what has stalled, and the single change most likely to help. Cite the actual numbers and dates. If the data is too sparse to draw a conclusion, say so rather than inventing a trend.`,
        );
      },
    );

    definePrompt(
      server,
      "check_muscle_balance",
      {
        title: "Check my muscle balance",
        description: "Look for neglected or over-trained muscle groups in recent training.",
        argsSchema: {
          weeks: z.string().optional().describe("How many weeks back to consider (default 12)"),
        },
      },
      (args) =>
        userMessage(
          `Check whether my training is balanced across muscle groups over the last ${args.weeks ?? "12"} weeks.

Use uplifting_get_muscle_balance for the volume split and uplifting_get_weekly_volume per group where something looks off. Also check uplifting_search_exercises with only_used=true to see which movements I actually rotate through.

Point out any group that is clearly under- or over-served relative to the others, note push/pull and upper/lower balance, and suggest specific exercises from my catalogue to fix the gaps. Don't recommend adding volume everywhere — say what to cut if something needs to make room.`,
        ),
    );
  }

  if (hasScope(ctx, "workouts:read") && hasScope(ctx, "workouts:write")) {
    definePrompt(
      server,
      "log_workout",
      {
        title: "Log a workout",
        description: "Turn a free-text description of a session into a logged workout.",
        argsSchema: {
          description: z
            .string()
            .describe(
              "What you did, in plain language — e.g. 'squat 5x5 at 100kg, then leg press'",
            ),
        },
      },
      (args) =>
        userMessage(
          `Log this workout for me: ${args.description}

Resolve each movement with uplifting_search_exercises first so you use the right exercise IDs, then log the whole session in one uplifting_log_workout call. If anything in my description is ambiguous — which variation, what unit, how many sets — ask me before writing, rather than guessing. When you're done, show me what was recorded and flag any set that beat a previous best.`,
        ),
    );

    definePrompt(
      server,
      "plan_next_workout",
      {
        title: "Plan my next workout",
        description: "Build the next session from what I've actually been training.",
        argsSchema: {
          focus: z
            .string()
            .optional()
            .describe("Optional focus, e.g. 'upper body', 'legs', 'whatever needs it most'"),
          minutes: z.string().optional().describe("How long I have, in minutes"),
        },
      },
      (args) =>
        userMessage(
          `Plan my next workout${args.focus ? ` focused on ${args.focus}` : ""}${args.minutes ? `, in about ${args.minutes} minutes` : ""}.

Ground it in my actual history:
- uplifting_list_workouts for what I've done recently and what's recovered
- uplifting_get_muscle_balance for what's been neglected
- uplifting_get_personal_records and uplifting_get_exercise_history for the loads I'm actually working with

Give me a concrete session: exercises, sets, reps and target loads based on my recent numbers — not generic percentages. Only prescribe exercises that exist in my catalogue, and say briefly why each one is there. Don't log anything unless I ask you to.`,
        ),
    );
  }
}
