/**
 * Analytical tools: lifetime stats, personal records, muscle-group balance and
 * weekly volume. These are what turn the raw log into something worth talking
 * about, so they do the aggregation in Postgres rather than shipping every set
 * back to the model.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sql } from "../../db";
import {
  type McpContext,
  formatDate,
  isoDateSchema,
  parseDate,
  respond,
  responseFormatSchema,
  round,
  scopedTool,
  toolError,
} from "../shared";

/** Resolve a window into an inclusive ISO range, defaulting to the last N days. */
function resolveWindow(from: string | undefined, to: string | undefined, defaultDays: number) {
  const parsedTo = parseDate(to) ?? new Date();
  const parsedFrom = parseDate(from) ?? new Date(parsedTo.getTime() - defaultDays * 86_400_000);
  return { from: parsedFrom, to: parsedTo };
}

export function registerAnalyticsTools(server: McpServer, ctx: McpContext): void {
  scopedTool(
    server,
    ctx,
    "workouts:read",
    "uplifting_get_training_stats",
    {
      title: "Get training stats",
      description: `Lifetime training totals plus the current and best workout streaks, and the user's most-trained exercises.

Args:
  - response_format ('markdown' | 'json')

Returns JSON of shape:
  {
    "total_workouts": number, "total_sets": number, "total_reps": number,
    "total_volume_kg": number, "total_time_minutes": number,
    "current_streak_days": number, "best_streak_days": number,
    "first_workout": string | null, "last_workout": string | null,
    "workouts_last_30_days": number,
    "top_exercises": [{ "id": string, "name": string, "workout_count": number,
                        "total_sets": number, "total_volume_kg": number }]
  }

Examples:
  - "How much have I lifted in total?" -> read total_volume_kg
  - "Am I on a streak?" -> read current_streak_days`,
      inputSchema: { response_format: responseFormatSchema },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const [totals, time, streaks, recent, topExercises] = await Promise.all([
        sql`
          SELECT COUNT(DISTINCT w.id) as total_workouts,
                 COALESCE(SUM((CASE WHEN s.weight_unit = 'lbs' THEN s.weight * 0.453592 ELSE s.weight END) * s.reps), 0) as total_volume,
                 COUNT(s.id) FILTER (WHERE s.side IS NULL OR s.side = 'R') as total_sets,
                 COALESCE(SUM(s.reps), 0) as total_reps,
                 MIN(w.start_time) as first_workout, MAX(w.start_time) as last_workout
          FROM workouts w LEFT JOIN user_sets s ON s.workout_id = w.id
          WHERE w.user_id = ${ctx.userId} AND w.kind = 'workout'
        `,
        sql`
          SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 60), 0)::bigint as total_time_minutes
          FROM workouts WHERE user_id = ${ctx.userId} AND kind = 'workout' AND end_time IS NOT NULL
        `,
        // Classic gaps-and-islands: subtracting the row number from the date
        // makes every run of consecutive days share one group key.
        sql`
          WITH workout_dates AS (
            SELECT DISTINCT (start_time AT TIME ZONE 'UTC')::date AS d
            FROM workouts WHERE user_id = ${ctx.userId}
          ),
          numbered AS (
            SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d ASC))::int AS grp FROM workout_dates
          ),
          runs AS (SELECT grp, COUNT(*) as len, MAX(d) as last_day FROM numbered GROUP BY grp)
          SELECT
            COALESCE(MAX(len), 0)::bigint as best_streak,
            COALESCE(MAX(len) FILTER (WHERE last_day >= CURRENT_DATE - 1), 0)::bigint as current_streak
          FROM runs
        `,
        sql`
          SELECT COUNT(*)::int as count FROM workouts
          WHERE user_id = ${ctx.userId} AND kind = 'workout' AND start_time >= NOW() - INTERVAL '30 days'
        `,
        sql`
          SELECT e.id, e.name,
                 COUNT(DISTINCT s.workout_id) as workout_count,
                 COUNT(s.id) FILTER (WHERE s.side IS NULL OR s.side = 'R') as total_sets,
                 COALESCE(SUM((CASE WHEN s.weight_unit = 'lbs' THEN s.weight * 0.453592 ELSE s.weight END) * s.reps), 0) as total_volume
          FROM user_sets s JOIN exercises e ON e.id = s.exercise_id
          WHERE s.user_id = ${ctx.userId}
          GROUP BY e.id, e.name
          ORDER BY COUNT(DISTINCT s.workout_id) DESC, e.name ASC
          LIMIT 10
        `,
      ]);

      const row = totals[0];
      const structured = {
        total_workouts: Number(row?.total_workouts ?? 0),
        total_sets: Number(row?.total_sets ?? 0),
        total_reps: Number(row?.total_reps ?? 0),
        total_volume_kg: round(Number(row?.total_volume ?? 0)),
        total_time_minutes: Number(time[0]?.total_time_minutes ?? 0),
        current_streak_days: Number(streaks[0]?.current_streak ?? 0),
        best_streak_days: Number(streaks[0]?.best_streak ?? 0),
        first_workout: row?.first_workout
          ? new Date(row.first_workout as string).toISOString()
          : null,
        last_workout: row?.last_workout ? new Date(row.last_workout as string).toISOString() : null,
        workouts_last_30_days: Number(recent[0]?.count ?? 0),
        top_exercises: topExercises.map((e) => ({
          id: e.id as string,
          name: e.name as string,
          workout_count: Number(e.workout_count),
          total_sets: Number(e.total_sets),
          total_volume_kg: round(Number(e.total_volume)),
        })),
      };

      const lines = [
        "# Training stats",
        "",
        `**${structured.total_workouts}** workouts · **${structured.total_sets}** sets · **${structured.total_reps}** reps`,
        `**${structured.total_volume_kg}kg** lifetime volume · ${Math.round(structured.total_time_minutes / 60)}h under the bar`,
        `Current streak: **${structured.current_streak_days}** days (best ${structured.best_streak_days})`,
        `Last 30 days: ${structured.workouts_last_30_days} workouts`,
        structured.first_workout
          ? `Training since ${formatDate(structured.first_workout)}`
          : "No workouts logged yet.",
        "",
        "## Most trained",
        "",
      ];
      for (const exercise of structured.top_exercises) {
        lines.push(
          `- **${exercise.name}** — ${exercise.workout_count} sessions, ${exercise.total_sets} sets, ${exercise.total_volume_kg}kg`,
        );
      }

      return respond(args.response_format, lines.join("\n"), structured);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:read",
    "uplifting_get_personal_records",
    {
      title: "Get personal records",
      description: `The user's best set for each exercise, ranked by estimated one-rep max (Epley: weight × (1 + reps/30)), so records across different rep ranges are comparable.

Args:
  - exercise_id (string, optional): restrict to a single exercise
  - muscle_group (string, optional): restrict to exercises hitting a muscle group
  - limit (number): max records, 1-100 (default 20)
  - response_format ('markdown' | 'json')

Returns JSON of shape:
  {
    "count": number,
    "records": [{
      "exercise_id": string, "exercise_name": string,
      "best_weight": number, "weight_unit": string, "reps": number,
      "estimated_1rm_kg": number, "achieved_at": string, "workout_id": string,
      "heaviest_weight_kg": number
    }]
  }

Note: "best" is the highest estimated 1RM; "heaviest_weight_kg" is the largest load ever moved, which can come from a different set.`,
      inputSchema: {
        exercise_id: z.string().uuid().optional().describe("Restrict to one exercise"),
        muscle_group: z
          .string()
          .max(100)
          .optional()
          .describe("Restrict to a major/minor muscle group"),
        limit: z.number().int().min(1).max(100).default(20).describe("Maximum records to return"),
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const rows = await sql`
        WITH scored AS (
          SELECT s.exercise_id, e.name as exercise_name, s.weight, s.weight_unit, s.reps,
                 s.workout_id, w.start_time,
                 (CASE WHEN s.weight_unit = 'lbs' THEN s.weight * 0.453592 ELSE s.weight END) as weight_kg,
                 (CASE WHEN s.weight_unit = 'lbs' THEN s.weight * 0.453592 ELSE s.weight END)
                   * (1 + LEAST(s.reps, 30)::numeric / 30) as est_1rm
          FROM user_sets s
          JOIN exercises e ON e.id = s.exercise_id
          JOIN workouts w ON w.id = s.workout_id
          WHERE s.user_id = ${ctx.userId} AND s.reps > 0 AND s.weight > 0
            AND (${args.exercise_id ?? null}::uuid IS NULL OR s.exercise_id = ${args.exercise_id ?? null}::uuid)
            AND (${args.muscle_group ?? null}::text IS NULL OR EXISTS (
                  SELECT 1 FROM exercise_muscle_relations r
                  JOIN muscles m ON m.id = r.muscle_id
                  WHERE r.exercise_id = s.exercise_id
                    AND (LOWER(m.major_group) = LOWER(${args.muscle_group ?? null})
                         OR LOWER(m.minor_group) = LOWER(${args.muscle_group ?? null}))
                ))
        ),
        best AS (
          SELECT DISTINCT ON (exercise_id) * FROM scored
          ORDER BY exercise_id, est_1rm DESC, start_time ASC
        ),
        heaviest AS (
          SELECT exercise_id, MAX(weight_kg) as heaviest_weight_kg FROM scored GROUP BY exercise_id
        )
        SELECT b.*, h.heaviest_weight_kg
        FROM best b JOIN heaviest h ON h.exercise_id = b.exercise_id
        ORDER BY b.est_1rm DESC
        LIMIT ${args.limit}
      `;

      const structured = {
        count: rows.length,
        records: rows.map((row) => ({
          exercise_id: row.exercise_id as string,
          exercise_name: row.exercise_name as string,
          best_weight: Number(row.weight),
          weight_unit: row.weight_unit as string,
          reps: row.reps as number,
          estimated_1rm_kg: round(Number(row.est_1rm)),
          achieved_at: new Date(row.start_time as string).toISOString(),
          workout_id: row.workout_id as string,
          heaviest_weight_kg: round(Number(row.heaviest_weight_kg)),
        })),
      };

      if (structured.count === 0) {
        return respond(
          args.response_format,
          "No personal records yet — log some sets with a load and reps first.",
          structured,
        );
      }

      const lines = ["# Personal records", "", "Ranked by estimated 1RM.", ""];
      for (const record of structured.records) {
        lines.push(
          `- **${record.exercise_name}** — ${record.best_weight}${record.weight_unit} × ${record.reps} (est. 1RM **${record.estimated_1rm_kg}kg**) on ${formatDate(record.achieved_at)}`,
        );
      }

      return respond(args.response_format, lines.join("\n"), structured);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:read",
    "uplifting_get_muscle_balance",
    {
      title: "Get muscle group balance",
      description: `Training volume and set count per muscle group over a window, for spotting neglected or over-hammered areas.

Volume is attributed to an exercise's primary muscles only, so a bench press counts toward chest rather than being split across triceps and shoulders.

Args:
  - from / to (string, optional): ISO date bounds; defaults to the last 90 days
  - response_format ('markdown' | 'json')

Returns JSON of shape:
  {
    "from": string, "to": string, "total_volume_kg": number,
    "groups": [{ "group": string, "volume_kg": number, "sets": number,
                 "share_percent": number, "exercises": number }]
  }

Examples:
  - "Am I neglecting legs?" -> compare share_percent across groups
  - "What did I train most this month?" -> from = first of the month`,
      inputSchema: {
        from: isoDateSchema.optional().describe("Start of the window (default: 90 days ago)"),
        to: isoDateSchema.optional().describe("End of the window (default: now)"),
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      if (args.from && !parseDate(args.from))
        return toolError(`Error: 'from' is not a valid date: ${args.from}`);
      if (args.to && !parseDate(args.to))
        return toolError(`Error: 'to' is not a valid date: ${args.to}`);
      const window = resolveWindow(args.from, args.to, 90);

      const rows = await sql`
        SELECT COALESCE(m.major_group, 'Other') as group_name,
               COALESCE(SUM((CASE WHEN s.weight_unit = 'lbs' THEN s.weight * 0.453592 ELSE s.weight END) * s.reps), 0) as volume,
               COUNT(s.id) FILTER (WHERE s.side IS NULL OR s.side = 'R') as sets,
               COUNT(DISTINCT s.exercise_id) as exercises
        FROM user_sets s
        JOIN workouts w ON w.id = s.workout_id
        JOIN exercise_muscle_relations r ON r.exercise_id = s.exercise_id AND r.is_primary = true
        JOIN muscles m ON m.id = r.muscle_id
        WHERE s.user_id = ${ctx.userId}
          AND w.start_time >= ${window.from.toISOString()}::timestamptz
          AND w.start_time <= ${window.to.toISOString()}::timestamptz
        GROUP BY m.major_group
        ORDER BY volume DESC
      `;

      const totalVolume = rows.reduce((sum, row) => sum + Number(row.volume), 0);
      const structured = {
        from: window.from.toISOString(),
        to: window.to.toISOString(),
        total_volume_kg: round(totalVolume),
        groups: rows.map((row) => ({
          group: row.group_name as string,
          volume_kg: round(Number(row.volume)),
          sets: Number(row.sets),
          share_percent: totalVolume > 0 ? round((Number(row.volume) / totalVolume) * 100) : 0,
          exercises: Number(row.exercises),
        })),
      };

      if (structured.groups.length === 0) {
        return respond(
          args.response_format,
          `No sets logged between ${formatDate(window.from)} and ${formatDate(window.to)}.`,
          structured,
        );
      }

      const lines = [
        `# Muscle balance — ${formatDate(window.from)} to ${formatDate(window.to)}`,
        "",
        `Total volume: ${structured.total_volume_kg}kg`,
        "",
      ];
      for (const group of structured.groups) {
        const bar = "█".repeat(Math.max(1, Math.round(group.share_percent / 4)));
        lines.push(
          `- **${group.group}** — ${group.share_percent}% · ${group.volume_kg}kg · ${group.sets} sets  ${bar}`,
        );
      }

      return respond(args.response_format, lines.join("\n"), structured);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:read",
    "uplifting_get_weekly_volume",
    {
      title: "Get weekly training volume",
      description: `A week-by-week series of training volume, sets and session count. Use it to see whether load is trending up, flat, or has dropped off.

Args:
  - weeks (number): how many recent weeks to include, 1-52 (default 12)
  - muscle_group (string, optional): restrict to one muscle group's primary volume
  - response_format ('markdown' | 'json')

Returns JSON of shape:
  {
    "weeks": [{ "week_start": string, "workouts": number, "sets": number,
                "reps": number, "volume_kg": number }],
    "average_weekly_volume_kg": number,
    "trend": "rising" | "falling" | "flat"
  }

The trend compares the mean of the most recent third of the window against the earliest third; a change under 5% reads as flat.`,
      inputSchema: {
        weeks: z.number().int().min(1).max(52).default(12).describe("Number of recent weeks"),
        muscle_group: z.string().max(100).optional().describe("Restrict to one muscle group"),
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const rows = await sql`
        SELECT date_trunc('week', w.start_time)::date as week_start,
               COUNT(DISTINCT w.id) as workouts,
               COUNT(s.id) FILTER (WHERE s.side IS NULL OR s.side = 'R') as sets,
               COALESCE(SUM(s.reps), 0) as reps,
               COALESCE(SUM((CASE WHEN s.weight_unit = 'lbs' THEN s.weight * 0.453592 ELSE s.weight END) * s.reps), 0) as volume
        FROM workouts w
        LEFT JOIN user_sets s ON s.workout_id = w.id
          AND (${args.muscle_group ?? null}::text IS NULL OR EXISTS (
                SELECT 1 FROM exercise_muscle_relations r
                JOIN muscles m ON m.id = r.muscle_id
                WHERE r.exercise_id = s.exercise_id AND r.is_primary = true
                  AND (LOWER(m.major_group) = LOWER(${args.muscle_group ?? null})
                       OR LOWER(m.minor_group) = LOWER(${args.muscle_group ?? null}))
              ))
        WHERE w.user_id = ${ctx.userId} AND w.kind = 'workout'
          AND w.start_time >= date_trunc('week', NOW()) - (${args.weeks - 1} || ' weeks')::interval
        GROUP BY week_start
        ORDER BY week_start ASC
      `;

      const weeks = rows.map((row) => ({
        week_start: formatDate(row.week_start as string),
        workouts: Number(row.workouts),
        sets: Number(row.sets),
        reps: Number(row.reps),
        volume_kg: round(Number(row.volume)),
      }));

      const average =
        weeks.length > 0 ? round(weeks.reduce((sum, w) => sum + w.volume_kg, 0) / weeks.length) : 0;

      // Compare the first and last thirds so a single heavy week doesn't
      // dominate the read.
      let trend: "rising" | "falling" | "flat" = "flat";
      if (weeks.length >= 3) {
        const third = Math.max(1, Math.floor(weeks.length / 3));
        const mean = (slice: typeof weeks) =>
          slice.reduce((sum, w) => sum + w.volume_kg, 0) / slice.length;
        const early = mean(weeks.slice(0, third));
        const late = mean(weeks.slice(-third));
        if (early > 0) {
          const change = (late - early) / early;
          if (change > 0.05) trend = "rising";
          else if (change < -0.05) trend = "falling";
        }
      }

      const structured = { weeks, average_weekly_volume_kg: average, trend };

      if (weeks.length === 0) {
        return respond(args.response_format, "No workouts in that window.", structured);
      }

      const peak = Math.max(...weeks.map((w) => w.volume_kg), 1);
      const lines = [
        `# Weekly volume${args.muscle_group ? ` — ${args.muscle_group}` : ""}`,
        "",
        `Average ${average}kg/week · trend: **${trend}**`,
        "",
      ];
      for (const week of weeks) {
        const bar = "█".repeat(Math.max(1, Math.round((week.volume_kg / peak) * 24)));
        lines.push(
          `${week.week_start}  ${bar} ${week.volume_kg}kg (${week.workouts} sessions, ${week.sets} sets)`,
        );
      }

      return respond(args.response_format, lines.join("\n"), structured);
    },
  );
}
