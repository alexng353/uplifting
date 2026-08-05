/**
 * Exercise catalogue tools: search, detail, per-exercise history, and the
 * per-user annotations (notes, favourites, machine profiles).
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sql } from "../../db";
import {
  type McpContext,
  estimate1RM,
  formatDate,
  formatSet,
  isoDateSchema,
  paginate,
  paginationSchema,
  parseDate,
  respond,
  responseFormatSchema,
  round,
  scopedTool,
  toKg,
  toolError,
} from "../shared";
import { resolveExercise } from "./exercise-lookup";

const EXERCISE_TYPES = [
  "dumbbell",
  "barbell",
  "bodyweight",
  "machine",
  "kettlebell",
  "resistance_band",
  "cable",
  "medicine_ball",
  "plyometric",
  "plate_loaded_machine",
] as const;

export function registerExerciseTools(server: McpServer, ctx: McpContext): void {
  scopedTool(
    server,
    ctx,
    "workouts:read",
    "uplifting_search_exercises",
    {
      title: "Search exercises",
      description: `Search the exercise catalogue (official exercises plus any the user created). Use this to turn a movement name into the exercise_id that the logging tools want.

Results are ranked: exact name matches first, then prefix matches, then anything containing the query. Exercises the user has actually trained rank above ones they haven't.

Args:
  - query (string, optional): name fragment, e.g. "bench"; omit to browse by filter alone
  - exercise_type (string, optional): one of ${EXERCISE_TYPES.join(", ")}
  - muscle (string, optional): exact muscle name, e.g. "Pectoralis Major"
  - muscle_group (string, optional): major or minor group, e.g. "Chest"
  - only_used (boolean): restrict to exercises this user has logged before (default false)
  - limit / offset (number): paging (default 20 / 0)
  - response_format ('markdown' | 'json')

Returns JSON of shape:
  {
    "total": number, "count": number, "offset": number, "has_more": boolean,
    "items": [{
      "id": string, "name": string, "exercise_type": string, "official": boolean,
      "primary_muscles": string[], "secondary_muscles": string[],
      "times_performed": number, "last_performed": string | null, "is_favourite": boolean
    }]
  }

Examples:
  - "log my bench press" -> query="bench press", take the top id
  - "what chest exercises do I know?" -> muscle_group="Chest", only_used=true`,
      inputSchema: {
        query: z.string().max(100).optional().describe("Name fragment to search for"),
        exercise_type: z.enum(EXERCISE_TYPES).optional().describe("Filter by equipment type"),
        muscle: z.string().max(100).optional().describe("Filter by exact muscle name"),
        muscle_group: z
          .string()
          .max(100)
          .optional()
          .describe("Filter by major or minor muscle group"),
        only_used: z
          .boolean()
          .default(false)
          .describe("Only exercises this user has logged at least once"),
        ...paginationSchema,
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
      const query = args.query?.trim() ?? null;

      const rows = await sql`
        WITH usage AS (
          SELECT exercise_id,
                 COUNT(DISTINCT workout_id) as times_performed,
                 MAX(created_at) as last_performed
          FROM user_sets WHERE user_id = ${ctx.userId}
          GROUP BY exercise_id
        )
        SELECT e.id, e.name, e.exercise_type, e.official, e.description,
               COALESCE(u.times_performed, 0) as times_performed,
               u.last_performed,
               (fav.exercise_id IS NOT NULL) as is_favourite,
               COALESCE((
                 SELECT array_agg(m.name) FROM exercise_muscle_relations r
                 JOIN muscles m ON m.id = r.muscle_id
                 WHERE r.exercise_id = e.id AND r.is_primary = true
               ), '{}') as primary_muscles,
               COALESCE((
                 SELECT array_agg(m.name) FROM exercise_muscle_relations r
                 JOIN muscles m ON m.id = r.muscle_id
                 WHERE r.exercise_id = e.id AND r.is_primary = false
               ), '{}') as secondary_muscles,
               COUNT(*) OVER () as total_count
        FROM exercises e
        LEFT JOIN usage u ON u.exercise_id = e.id
        LEFT JOIN favourite_exercises fav
          ON fav.exercise_id = e.id AND fav.user_id = ${ctx.userId}
        WHERE (e.official = true OR e.author_id = ${ctx.userId})
          AND (${query}::text IS NULL OR LOWER(e.name) LIKE LOWER(${query ? `%${query}%` : null}))
          AND (${args.exercise_type ?? null}::text IS NULL OR e.exercise_type::text = ${args.exercise_type ?? null})
          AND (${args.only_used ? 1 : 0} = 0 OR u.times_performed IS NOT NULL)
          AND (${args.muscle ?? null}::text IS NULL OR EXISTS (
                SELECT 1 FROM exercise_muscle_relations r
                JOIN muscles m ON m.id = r.muscle_id
                WHERE r.exercise_id = e.id AND LOWER(m.name) = LOWER(${args.muscle ?? null})
              ))
          AND (${args.muscle_group ?? null}::text IS NULL OR EXISTS (
                SELECT 1 FROM exercise_muscle_relations r
                JOIN muscles m ON m.id = r.muscle_id
                WHERE r.exercise_id = e.id
                  AND (LOWER(m.major_group) = LOWER(${args.muscle_group ?? null})
                       OR LOWER(m.minor_group) = LOWER(${args.muscle_group ?? null}))
              ))
        ORDER BY
          CASE
            WHEN ${query}::text IS NULL THEN 3
            WHEN LOWER(e.name) = LOWER(${query}) THEN 0
            WHEN LOWER(e.name) LIKE LOWER(${query ? `${query}%` : null}) THEN 1
            ELSE 2
          END ASC,
          COALESCE(u.times_performed, 0) DESC,
          e.name ASC
        LIMIT ${args.limit} OFFSET ${args.offset}
      `;

      const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
      const items = rows.map((row) => ({
        id: row.id as string,
        name: row.name as string,
        exercise_type: row.exercise_type as string,
        official: row.official as boolean,
        primary_muscles: (row.primary_muscles as string[]) ?? [],
        secondary_muscles: (row.secondary_muscles as string[]) ?? [],
        times_performed: Number(row.times_performed),
        last_performed: row.last_performed
          ? new Date(row.last_performed as string).toISOString()
          : null,
        is_favourite: row.is_favourite as boolean,
      }));

      const page = paginate(items, total, args.offset);

      if (items.length === 0) {
        return respond(
          args.response_format,
          `No exercises matched${query ? ` "${query}"` : " those filters"}. Try a shorter query or drop a filter.`,
          page,
        );
      }

      const lines = [`# Exercises (${page.count} of ${page.total})`, ""];
      for (const item of items) {
        const muscles = item.primary_muscles.length ? ` — ${item.primary_muscles.join(", ")}` : "";
        const used = item.times_performed > 0 ? ` · trained ${item.times_performed}×` : "";
        lines.push(
          `- **${item.name}** (${item.exercise_type})${muscles}${used}`,
          `  id: \`${item.id}\``,
        );
      }
      if (page.has_more)
        lines.push("", `More available — call again with offset=${page.next_offset}.`);

      return respond(args.response_format, lines.join("\n"), page);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:read",
    "uplifting_get_exercise",
    {
      title: "Get exercise details",
      description: `Full detail for one exercise: muscles worked, the user's best set, how often they train it, their saved note, and their machine/setup profiles.

Args:
  - exercise_id (string, optional) / exercise_name (string, optional): one is required
  - response_format ('markdown' | 'json')

Returns JSON of shape:
  {
    "id": string, "name": string, "exercise_type": string, "official": boolean,
    "description": string | null,
    "primary_muscles": string[], "secondary_muscles": string[],
    "is_favourite": boolean, "note": string | null,
    "stats": { "times_performed": number, "total_sets": number, "total_volume_kg": number,
               "first_performed": string | null, "last_performed": string | null },
    "best_set": { "weight": number, "weight_unit": string, "reps": number,
                  "estimated_1rm_kg": number, "performed_at": string } | null,
    "profiles": [{ "id": string, "name": string }]
  }`,
      inputSchema: {
        exercise_id: z.string().uuid().optional().describe("Exercise UUID"),
        exercise_name: z
          .string()
          .min(1)
          .optional()
          .describe("Exercise name, if the UUID is unknown"),
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
      const lookup = await resolveExercise(ctx.userId, args.exercise_id, args.exercise_name);
      if (!lookup.ok) return toolError(lookup.message);
      const exerciseId = lookup.exercise.id;

      const [detail, primary, secondary, stats, sets, note, favourite, profiles] =
        await Promise.all([
          sql`SELECT id, name, exercise_type, official, description FROM exercises WHERE id = ${exerciseId}`,
          sql`SELECT m.name FROM muscles m JOIN exercise_muscle_relations r ON r.muscle_id = m.id
            WHERE r.exercise_id = ${exerciseId} AND r.is_primary = true ORDER BY m.name`,
          sql`SELECT m.name FROM muscles m JOIN exercise_muscle_relations r ON r.muscle_id = m.id
            WHERE r.exercise_id = ${exerciseId} AND r.is_primary = false ORDER BY m.name`,
          sql`SELECT COUNT(DISTINCT workout_id) as times_performed,
                   COUNT(*) FILTER (WHERE side IS NULL OR side = 'R') as total_sets,
                   COALESCE(SUM((CASE WHEN weight_unit = 'lbs' THEN weight * 0.453592 ELSE weight END) * reps), 0) as total_volume,
                   MIN(created_at) as first_performed, MAX(created_at) as last_performed
            FROM user_sets WHERE user_id = ${ctx.userId} AND exercise_id = ${exerciseId}`,
          // Best set is picked by estimated 1RM rather than raw load, so a heavy
          // single and a strong set of eight compete on equal terms.
          sql`SELECT s.weight, s.weight_unit, s.reps, w.start_time
            FROM user_sets s JOIN workouts w ON w.id = s.workout_id
            WHERE s.user_id = ${ctx.userId} AND s.exercise_id = ${exerciseId} AND s.reps > 0
            ORDER BY (CASE WHEN s.weight_unit = 'lbs' THEN s.weight * 0.453592 ELSE s.weight END)
                     * (1 + LEAST(s.reps, 30)::numeric / 30) DESC
            LIMIT 1`,
          sql`SELECT note FROM exercise_notes WHERE user_id = ${ctx.userId} AND exercise_id = ${exerciseId}`,
          sql`SELECT 1 FROM favourite_exercises WHERE user_id = ${ctx.userId} AND exercise_id = ${exerciseId}`,
          sql`SELECT id, name FROM exercise_profiles WHERE user_id = ${ctx.userId} AND exercise_id = ${exerciseId} ORDER BY name`,
        ]);

      if (detail.length === 0) return toolError("Exercise not found.");

      const row = detail[0];
      const statRow = stats[0];
      const bestRow = sets[0];
      const bestKg = bestRow ? toKg(Number(bestRow.weight), bestRow.weight_unit as string) : 0;

      const structured = {
        id: row.id as string,
        name: row.name as string,
        exercise_type: row.exercise_type as string,
        official: row.official as boolean,
        description: (row.description as string | null) ?? null,
        primary_muscles: primary.map((m) => m.name as string),
        secondary_muscles: secondary.map((m) => m.name as string),
        is_favourite: favourite.length > 0,
        note: (note[0]?.note as string | undefined) ?? null,
        stats: {
          times_performed: Number(statRow?.times_performed ?? 0),
          total_sets: Number(statRow?.total_sets ?? 0),
          total_volume_kg: round(Number(statRow?.total_volume ?? 0)),
          first_performed: statRow?.first_performed
            ? new Date(statRow.first_performed as string).toISOString()
            : null,
          last_performed: statRow?.last_performed
            ? new Date(statRow.last_performed as string).toISOString()
            : null,
        },
        best_set: bestRow
          ? {
              weight: Number(bestRow.weight),
              weight_unit: bestRow.weight_unit as string,
              reps: bestRow.reps as number,
              estimated_1rm_kg: round(estimate1RM(bestKg, bestRow.reps as number)),
              performed_at: new Date(bestRow.start_time as string).toISOString(),
            }
          : null,
        profiles: profiles.map((p) => ({ id: p.id as string, name: p.name as string })),
      };

      const lines = [
        `# ${structured.name}`,
        "",
        `Type: ${structured.exercise_type}`,
        structured.primary_muscles.length
          ? `Primary: ${structured.primary_muscles.join(", ")}`
          : "",
        structured.secondary_muscles.length
          ? `Secondary: ${structured.secondary_muscles.join(", ")}`
          : "",
        "",
        `Trained ${structured.stats.times_performed}× · ${structured.stats.total_sets} sets · ${structured.stats.total_volume_kg}kg lifetime volume`,
        structured.best_set
          ? `Best set: ${formatSet({ ...structured.best_set, side: null })} (est. 1RM ${structured.best_set.estimated_1rm_kg}kg) on ${formatDate(structured.best_set.performed_at)}`
          : "No sets logged yet.",
        structured.note ? `\nNote: ${structured.note}` : "",
        structured.profiles.length
          ? `\nProfiles: ${structured.profiles.map((p) => `${p.name} (${p.id})`).join(", ")}`
          : "",
        `\nid: \`${structured.id}\``,
      ].filter(Boolean);

      return respond(args.response_format, lines.join("\n"), structured);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:read",
    "uplifting_get_exercise_history",
    {
      title: "Get exercise history",
      description: `Every session in which the user performed a given exercise, oldest first, with per-session top set and estimated 1RM. This is the tool for progression questions.

Args:
  - exercise_id (string, optional) / exercise_name (string, optional): one is required
  - from / to (string, optional): ISO date bounds on the session date
  - limit (number): max sessions returned, most recent kept when the range is larger (default 20, max 100)
  - response_format ('markdown' | 'json')

Returns JSON of shape:
  {
    "exercise_id": string, "exercise_name": string, "session_count": number,
    "sessions": [{
      "workout_id": string, "date": string,
      "sets": [{ "reps": number, "weight": number, "weight_unit": string, "side": string | null }],
      "top_set": { "weight": number, "weight_unit": string, "reps": number },
      "best_estimated_1rm_kg": number, "volume_kg": number
    }],
    "trend": { "first_1rm_kg": number, "latest_1rm_kg": number, "change_kg": number, "change_percent": number } | null
  }

Examples:
  - "Is my squat going up?" -> exercise_name="Squat", read "trend"
  - "What did I bench last time?" -> limit=1 and read the last session`,
      inputSchema: {
        exercise_id: z.string().uuid().optional().describe("Exercise UUID"),
        exercise_name: z
          .string()
          .min(1)
          .optional()
          .describe("Exercise name, if the UUID is unknown"),
        from: isoDateSchema.optional().describe("Earliest session date (inclusive)"),
        to: isoDateSchema.optional().describe("Latest session date (inclusive)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe("Maximum number of sessions to return, most recent first"),
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
      const lookup = await resolveExercise(ctx.userId, args.exercise_id, args.exercise_name);
      if (!lookup.ok) return toolError(lookup.message);

      const from = parseDate(args.from);
      const to = parseDate(args.to);
      if (args.from && !from) return toolError(`Error: 'from' is not a valid date: ${args.from}`);
      if (args.to && !to) return toolError(`Error: 'to' is not a valid date: ${args.to}`);

      const rows = await sql`
        SELECT s.reps, s.weight, s.weight_unit, s.side, s.workout_id, w.start_time
        FROM user_sets s JOIN workouts w ON w.id = s.workout_id
        WHERE s.user_id = ${ctx.userId} AND s.exercise_id = ${lookup.exercise.id}
          AND (${from?.toISOString() ?? null}::timestamptz IS NULL OR w.start_time >= ${from?.toISOString() ?? null}::timestamptz)
          AND (${to?.toISOString() ?? null}::timestamptz IS NULL OR w.start_time <= ${to?.toISOString() ?? null}::timestamptz)
        ORDER BY w.start_time ASC, s.created_at ASC
      `;

      const sessions = new Map<
        string,
        {
          workout_id: string;
          date: string;
          sets: { reps: number; weight: number; weight_unit: string; side: string | null }[];
          top_set: { weight: number; weight_unit: string; reps: number };
          best_estimated_1rm_kg: number;
          volume_kg: number;
        }
      >();

      for (const row of rows) {
        const workoutId = row.workout_id as string;
        if (!sessions.has(workoutId)) {
          sessions.set(workoutId, {
            workout_id: workoutId,
            date: new Date(row.start_time as string).toISOString(),
            sets: [],
            top_set: { weight: 0, weight_unit: "kg", reps: 0 },
            best_estimated_1rm_kg: 0,
            volume_kg: 0,
          });
        }

        const session = sessions.get(workoutId)!;
        const weight = Number(row.weight);
        const unit = row.weight_unit as string;
        const reps = row.reps as number;
        const oneRm = estimate1RM(toKg(weight, unit), reps);

        session.sets.push({
          reps,
          weight,
          weight_unit: unit,
          side: (row.side as string | null) ?? null,
        });
        session.volume_kg = round(session.volume_kg + toKg(weight, unit) * reps);
        if (oneRm > session.best_estimated_1rm_kg) {
          session.best_estimated_1rm_kg = round(oneRm);
          session.top_set = { weight, weight_unit: unit, reps };
        }
      }

      // Keep the most recent `limit` sessions, but present them oldest-first so
      // the progression reads left to right.
      const all = [...sessions.values()];
      const kept = all.slice(Math.max(0, all.length - args.limit));

      const first = kept[0];
      const latest = kept[kept.length - 1];
      const trend =
        kept.length >= 2 && first.best_estimated_1rm_kg > 0
          ? {
              first_1rm_kg: first.best_estimated_1rm_kg,
              latest_1rm_kg: latest.best_estimated_1rm_kg,
              change_kg: round(latest.best_estimated_1rm_kg - first.best_estimated_1rm_kg),
              change_percent: round(
                ((latest.best_estimated_1rm_kg - first.best_estimated_1rm_kg) /
                  first.best_estimated_1rm_kg) *
                  100,
              ),
            }
          : null;

      const structured = {
        exercise_id: lookup.exercise.id,
        exercise_name: lookup.exercise.name,
        session_count: kept.length,
        sessions: kept,
        trend,
      };

      if (kept.length === 0) {
        return respond(
          args.response_format,
          `No logged sessions for ${lookup.exercise.name}${args.from || args.to ? " in that date range" : ""}.`,
          structured,
        );
      }

      const lines = [`# ${lookup.exercise.name} history`, "", `${kept.length} sessions`, ""];
      for (const session of kept) {
        const setText = session.sets.map((set) => formatSet(set)).join(", ");
        lines.push(
          `- **${formatDate(session.date)}** — ${setText} · est. 1RM ${session.best_estimated_1rm_kg}kg`,
        );
      }
      if (trend) {
        lines.push(
          "",
          `Trend: ${trend.first_1rm_kg}kg → ${trend.latest_1rm_kg}kg estimated 1RM (${trend.change_kg >= 0 ? "+" : ""}${trend.change_kg}kg, ${trend.change_percent >= 0 ? "+" : ""}${trend.change_percent}%)`,
        );
      }

      return respond(args.response_format, lines.join("\n"), structured);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:read",
    "uplifting_list_muscles",
    {
      title: "List muscles and muscle groups",
      description: `List the muscle taxonomy used to classify exercises. Useful for picking a valid 'muscle' or 'muscle_group' filter for uplifting_search_exercises.

Args:
  - response_format ('markdown' | 'json')

Returns JSON of shape:
  {
    "major_groups": string[], "minor_groups": string[],
    "muscles": [{ "id": string, "name": string, "scientific_name": string | null,
                  "major_group": string | null, "minor_group": string }]
  }`,
      inputSchema: { response_format: responseFormatSchema },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const rows = await sql`
        SELECT id, name, scientific_name, major_group, minor_group FROM muscles ORDER BY major_group, name
      `;

      const structured = {
        major_groups: [
          ...new Set(
            rows.map((r) => r.major_group as string | null).filter((g): g is string => !!g),
          ),
        ].sort(),
        minor_groups: [...new Set(rows.map((r) => r.minor_group as string))].sort(),
        muscles: rows.map((r) => ({
          id: r.id as string,
          name: r.name as string,
          scientific_name: (r.scientific_name as string | null) ?? null,
          major_group: (r.major_group as string | null) ?? null,
          minor_group: r.minor_group as string,
        })),
      };

      const lines = [
        "# Muscle groups",
        "",
        `Major: ${structured.major_groups.join(", ")}`,
        "",
        "# Muscles",
        "",
      ];
      for (const muscle of structured.muscles) {
        lines.push(`- ${muscle.name}${muscle.major_group ? ` (${muscle.major_group})` : ""}`);
      }

      return respond(args.response_format, lines.join("\n"), structured);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:write",
    "uplifting_set_exercise_note",
    {
      title: "Set an exercise note",
      description: `Save or clear the user's persistent cue for an exercise — the note shown every time they perform it ("elbows tucked", "seat position 4").

Args:
  - exercise_id (string, optional) / exercise_name (string, optional): one is required
  - note (string): the cue to store. Pass an empty string to clear it.

Returns { "exercise_id": string, "exercise_name": string, "note": string | null }.`,
      inputSchema: {
        exercise_id: z.string().uuid().optional().describe("Exercise UUID"),
        exercise_name: z
          .string()
          .min(1)
          .optional()
          .describe("Exercise name, if the UUID is unknown"),
        note: z.string().max(1000).describe("Cue to save; empty string clears the existing note"),
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const lookup = await resolveExercise(ctx.userId, args.exercise_id, args.exercise_name);
      if (!lookup.ok) return toolError(lookup.message);

      const note = args.note.trim();

      if (!note) {
        await sql`DELETE FROM exercise_notes WHERE user_id = ${ctx.userId} AND exercise_id = ${lookup.exercise.id}`;
        const cleared = {
          exercise_id: lookup.exercise.id,
          exercise_name: lookup.exercise.name,
          note: null,
        };
        return respond(
          args.response_format,
          `Cleared the note on ${lookup.exercise.name}.`,
          cleared,
        );
      }

      await sql`
        INSERT INTO exercise_notes (user_id, exercise_id, note, updated_at)
        VALUES (${ctx.userId}, ${lookup.exercise.id}, ${note}, now())
        ON CONFLICT (user_id, exercise_id) DO UPDATE SET note = EXCLUDED.note, updated_at = now()
      `;

      const structured = {
        exercise_id: lookup.exercise.id,
        exercise_name: lookup.exercise.name,
        note,
      };
      return respond(
        args.response_format,
        `Saved note on ${lookup.exercise.name}: "${note}"`,
        structured,
      );
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:write",
    "uplifting_set_exercise_favourite",
    {
      title: "Favourite or unfavourite an exercise",
      description: `Add or remove an exercise from the user's favourites.

Args:
  - exercise_id (string, optional) / exercise_name (string, optional): one is required
  - favourite (boolean): true to add, false to remove

Returns { "exercise_id": string, "exercise_name": string, "is_favourite": boolean }.`,
      inputSchema: {
        exercise_id: z.string().uuid().optional().describe("Exercise UUID"),
        exercise_name: z
          .string()
          .min(1)
          .optional()
          .describe("Exercise name, if the UUID is unknown"),
        favourite: z.boolean().describe("true to favourite, false to unfavourite"),
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const lookup = await resolveExercise(ctx.userId, args.exercise_id, args.exercise_name);
      if (!lookup.ok) return toolError(lookup.message);

      if (args.favourite) {
        await sql`
          INSERT INTO favourite_exercises (user_id, exercise_id)
          VALUES (${ctx.userId}, ${lookup.exercise.id})
          ON CONFLICT DO NOTHING
        `;
      } else {
        await sql`
          DELETE FROM favourite_exercises
          WHERE user_id = ${ctx.userId} AND exercise_id = ${lookup.exercise.id}
        `;
      }

      const structured = {
        exercise_id: lookup.exercise.id,
        exercise_name: lookup.exercise.name,
        is_favourite: args.favourite,
      };
      return respond(
        args.response_format,
        `${args.favourite ? "Favourited" : "Unfavourited"} ${lookup.exercise.name}.`,
        structured,
      );
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:read",
    "uplifting_list_exercise_profiles",
    {
      title: "List exercise profiles",
      description: `List the user's exercise profiles — named setup variants for the same movement, such as different machines at different gyms ("Hammer Strength", "Seat 4").

Pass a profile_id when logging sets so the history for each machine stays separate.

Args:
  - exercise_id (string, optional): restrict to one exercise's profiles
  - response_format ('markdown' | 'json')

Returns { "profiles": [{ "id": string, "name": string, "exercise_id": string, "exercise_name": string }] }.`,
      inputSchema: {
        exercise_id: z.string().uuid().optional().describe("Restrict to one exercise"),
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
        SELECT p.id, p.name, p.exercise_id, e.name as exercise_name
        FROM exercise_profiles p JOIN exercises e ON e.id = p.exercise_id
        WHERE p.user_id = ${ctx.userId}
          AND (${args.exercise_id ?? null}::uuid IS NULL OR p.exercise_id = ${args.exercise_id ?? null}::uuid)
        ORDER BY e.name, p.name
      `;

      const structured = {
        profiles: rows.map((row) => ({
          id: row.id as string,
          name: row.name as string,
          exercise_id: row.exercise_id as string,
          exercise_name: row.exercise_name as string,
        })),
      };

      if (structured.profiles.length === 0) {
        return respond(args.response_format, "No exercise profiles saved.", structured);
      }

      const lines = ["# Exercise profiles", ""];
      for (const profile of structured.profiles) {
        lines.push(`- **${profile.exercise_name}** → ${profile.name} (\`${profile.id}\`)`);
      }
      return respond(args.response_format, lines.join("\n"), structured);
    },
  );
}
