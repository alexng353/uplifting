/**
 * Workout and set tools — reading training history, and logging or correcting it.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, desc, eq, gte, isNull, lte, max, sql as dsql } from "drizzle-orm";
import { db, sql } from "../../db";
import { userSets, workouts } from "../../db/schema";
import {
  type McpContext,
  formatDate,
  formatDateTime,
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
  weightUnitSchema,
} from "../shared";
import { resolveExercise } from "./exercise-lookup";

const setInputSchema = z.object({
  reps: z.number().int().min(0).max(1000).describe("Repetitions completed in this set"),
  weight: z.number().min(0).max(2000).describe("Load used, in the unit given by weight_unit"),
  weight_unit: weightUnitSchema,
  side: z
    .enum(["L", "R"])
    .optional()
    .describe("For unilateral work, which side this set was performed on. Omit for two-sided sets"),
  bodyweight: z
    .number()
    .min(0)
    .max(700)
    .optional()
    .describe("Bodyweight at the time, for bodyweight-loaded movements"),
});

const exerciseEntrySchema = z.object({
  exercise_id: z
    .string()
    .uuid()
    .optional()
    .describe("Exercise UUID from uplifting_search_exercises. Preferred over exercise_name"),
  exercise_name: z
    .string()
    .min(1)
    .optional()
    .describe("Exercise name, resolved case-insensitively. Use when you don't have the UUID"),
  profile_id: z
    .string()
    .uuid()
    .optional()
    .describe(
      "Exercise profile UUID (a machine/setup variant), from uplifting_list_exercise_profiles",
    ),
  sets: z
    .array(setInputSchema)
    .min(1)
    .max(50)
    .describe("Sets performed for this exercise, in order"),
});

export function registerWorkoutTools(server: McpServer, ctx: McpContext): void {
  // ── Reading ──────────────────────────────────────────────────────────────

  scopedTool(
    server,
    ctx,
    "workouts:read",
    "uplifting_list_workouts",
    {
      title: "List workouts",
      description: `List the signed-in user's workouts, most recent first.

Returns a summary row per workout — not the individual sets. Call uplifting_get_workout with an id for the full session.

Args:
  - from (string, optional): only workouts starting on or after this ISO date
  - to (string, optional): only workouts starting on or before this ISO date
  - kind (string, optional): 'workout' (default in the app) or 'template'; omit for all
  - limit (number): max rows, 1-100 (default 20)
  - offset (number): rows to skip, for paging (default 0)
  - response_format ('markdown' | 'json'): output format (default 'markdown')

Returns JSON of shape:
  {
    "total": number, "count": number, "offset": number, "has_more": boolean, "next_offset"?: number,
    "items": [{
      "id": string, "name": string | null, "start_time": string, "end_time": string | null,
      "duration_minutes": number, "kind": string, "privacy": string, "gym_location": string | null,
      "total_sets": number, "total_reps": number, "total_volume_kg": number, "exercise_count": number
    }]
  }

Examples:
  - "What did I train last week?" -> from/to covering that week
  - "How many workouts have I logged?" -> limit=1, then read "total"
  - Don't use for a single session's sets; use uplifting_get_workout instead.`,
      inputSchema: {
        from: isoDateSchema.optional().describe("Earliest workout start (inclusive)"),
        to: isoDateSchema.optional().describe("Latest workout start (inclusive)"),
        kind: z.enum(["workout", "template"]).optional().describe("Filter by workout kind"),
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
      const from = parseDate(args.from);
      const to = parseDate(args.to);
      if (args.from && !from) return toolError(`Error: 'from' is not a valid date: ${args.from}`);
      if (args.to && !to) return toolError(`Error: 'to' is not a valid date: ${args.to}`);

      const filters = [eq(workouts.userId, ctx.userId)];
      if (from) filters.push(gte(workouts.startTime, from));
      if (to) filters.push(lte(workouts.startTime, to));
      if (args.kind) filters.push(eq(workouts.kind, args.kind));
      const where = and(...filters);

      const [countRow] = await db
        .select({ count: dsql<number>`count(*)::int` })
        .from(workouts)
        .where(where);

      const rows = await db
        .select()
        .from(workouts)
        .where(where)
        .orderBy(desc(workouts.startTime))
        .limit(args.limit)
        .offset(args.offset);

      const totals =
        rows.length > 0 ? await summarizeWorkouts(rows.map((row) => row.id)) : new Map();

      const items = rows.map((row) => {
        const summary = totals.get(row.id);
        const end = row.endTime ?? null;
        return {
          id: row.id,
          name: row.name,
          start_time: formatDateTime(row.startTime),
          end_time: end ? formatDateTime(end) : null,
          duration_minutes: end
            ? Math.round((end.getTime() - row.startTime.getTime()) / 60_000)
            : 0,
          kind: row.kind,
          privacy: row.privacy,
          gym_location: row.gymLocation,
          total_sets: summary?.total_sets ?? 0,
          total_reps: summary?.total_reps ?? 0,
          total_volume_kg: round(summary?.total_volume ?? 0),
          exercise_count: summary?.exercise_count ?? 0,
        };
      });

      const page = paginate(items, countRow?.count ?? 0, args.offset);

      if (page.items.length === 0) {
        return respond(args.response_format, "No workouts found for that filter.", page);
      }

      const lines = [`# Workouts (${page.count} of ${page.total})`, ""];
      for (const item of page.items) {
        lines.push(
          `- **${formatDate(item.start_time)}** — ${item.name ?? "Untitled"} · ${item.exercise_count} exercises, ${item.total_sets} sets, ${item.total_volume_kg}kg volume${item.duration_minutes ? `, ${item.duration_minutes} min` : ""}`,
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
    "uplifting_get_workout",
    {
      title: "Get a workout",
      description: `Fetch one workout in full: every exercise performed and every set, in the order they were done.

Args:
  - workout_id (string): workout UUID, from uplifting_list_workouts
  - response_format ('markdown' | 'json'): output format (default 'markdown')

Returns JSON of shape:
  {
    "id": string, "name": string | null, "start_time": string, "end_time": string | null,
    "duration_minutes": number, "kind": string, "privacy": string, "gym_location": string | null,
    "total_sets": number, "total_reps": number, "total_volume_kg": number,
    "exercises": [{
      "exercise_id": string, "exercise_name": string, "profile_id": string | null,
      "is_unilateral": boolean, "volume_kg": number,
      "sets": [{ "id": string, "reps": number, "weight": number, "weight_unit": string,
                 "side": string | null, "bodyweight": number | null, "estimated_1rm_kg": number }]
    }]
  }

Errors:
  - "Workout not found" if the id is unknown or belongs to another user.`,
      inputSchema: {
        workout_id: z.string().uuid().describe("Workout UUID"),
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
      const [workout] = await db
        .select()
        .from(workouts)
        .where(and(eq(workouts.id, args.workout_id), eq(workouts.userId, ctx.userId)))
        .limit(1);

      if (!workout) {
        return toolError(
          "Workout not found. Use uplifting_list_workouts to get valid workout IDs for this user.",
        );
      }

      const detail = await loadWorkoutDetail(workout);

      const lines = [
        `# ${detail.name ?? "Untitled workout"}`,
        "",
        `${formatDate(detail.start_time)} · ${detail.duration_minutes} min · ${detail.total_sets} sets · ${detail.total_volume_kg}kg total volume`,
        detail.gym_location ? `Gym: ${detail.gym_location}` : "",
        "",
      ].filter(Boolean);

      for (const exercise of detail.exercises) {
        lines.push(`## ${exercise.exercise_name}`);
        for (const set of exercise.sets) {
          lines.push(`- ${formatSet(set)}`);
        }
        lines.push("");
      }

      return respond(args.response_format, lines.join("\n"), detail);
    },
  );

  // ── Writing ──────────────────────────────────────────────────────────────

  scopedTool(
    server,
    ctx,
    "workouts:write",
    "uplifting_log_workout",
    {
      title: "Log a workout",
      description: `Create a completed workout with all of its exercises and sets in one call.

This is the tool to use when the user describes a session they already did ("I benched 80kg for 5, 5, 4 then did pull-ups"). Exercises are matched by exercise_id when given, otherwise by exercise_name (case-insensitive, exact). If a name is ambiguous or unknown the call fails with the candidate names, so search first with uplifting_search_exercises when unsure.

Args:
  - name (string, optional): session name, e.g. "Upper A"
  - start_time (string, optional): ISO start; defaults to now
  - end_time (string, optional): ISO end; omit for an open session
  - gym_location (string, optional): free-text gym name
  - privacy ('private' | 'friends' | 'public', optional): defaults to 'friends'
  - exercises (array): one entry per exercise, each with sets [{ reps, weight, weight_unit, side?, bodyweight? }]

Returns the created workout in the same shape as uplifting_get_workout.

Examples:
  - "Log today's session: squat 100kg 5x5" -> one exercise entry with five identical sets
  - "I did 3 sets of pull-ups at bodyweight" -> weight 0, weight_unit 'kg'
  - Don't use to add to an existing session; use uplifting_add_sets.

Errors:
  - "Exercise not found" with close matches, when a name can't be resolved.`,
      inputSchema: {
        name: z.string().max(255).optional().describe("Name for the session"),
        start_time: isoDateSchema.optional().describe("When the session started (defaults to now)"),
        end_time: isoDateSchema.optional().describe("When the session ended"),
        gym_location: z.string().max(255).optional().describe("Where it happened"),
        privacy: z
          .enum(["private", "friends", "public"])
          .optional()
          .describe("Who can see this workout (default 'friends')"),
        exercises: z.array(exerciseEntrySchema).min(1).max(30).describe("Exercises performed"),
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      const startTime = parseDate(args.start_time) ?? new Date();
      const endTime = parseDate(args.end_time);
      if (args.start_time && !parseDate(args.start_time)) {
        return toolError(`Error: 'start_time' is not a valid date: ${args.start_time}`);
      }
      if (args.end_time && !endTime) {
        return toolError(`Error: 'end_time' is not a valid date: ${args.end_time}`);
      }
      if (endTime && endTime < startTime) {
        return toolError("Error: 'end_time' is before 'start_time'.");
      }

      // Resolve every exercise up front so a bad name fails before anything is written.
      const resolved: (z.infer<typeof exerciseEntrySchema> & { exerciseId: string })[] = [];
      for (const entry of args.exercises) {
        const lookup = await resolveExercise(ctx.userId, entry.exercise_id, entry.exercise_name);
        if (!lookup.ok) return toolError(lookup.message);
        resolved.push({ ...entry, exerciseId: lookup.exercise.id });
      }

      const created = await db.transaction(async (tx) => {
        const [workout] = await tx
          .insert(workouts)
          .values({
            userId: ctx.userId,
            name: args.name,
            startTime,
            endTime: endTime ?? undefined,
            privacy: args.privacy ?? "friends",
            gymLocation: args.gym_location,
            kind: "workout",
          })
          .returning();

        for (const [position, entry] of resolved.entries()) {
          for (const set of entry.sets) {
            await tx.insert(userSets).values({
              userId: ctx.userId,
              workoutId: workout.id,
              exerciseId: entry.exerciseId,
              profileId: entry.profile_id,
              reps: set.reps,
              weight: String(set.weight),
              weightUnit: set.weight_unit,
              side: set.side,
              bodyweight: set.bodyweight !== undefined ? String(set.bodyweight) : undefined,
              position,
            });
          }
        }

        return workout;
      });

      const detail = await loadWorkoutDetail(created);
      const summary = `Logged **${detail.name ?? "workout"}** on ${formatDate(detail.start_time)}: ${detail.exercises.length} exercises, ${detail.total_sets} sets, ${detail.total_volume_kg}kg total volume.\n\nWorkout id: \`${detail.id}\``;
      return respond(args.response_format, summary, detail);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:write",
    "uplifting_add_sets",
    {
      title: "Add sets to a workout",
      description: `Append sets to an existing workout — for correcting an omission or extending an in-progress session.

Sets join the exercise's existing group in that workout when one is present, otherwise the exercise is appended after the last one.

Args:
  - workout_id (string): workout UUID
  - exercise_id (string, optional) / exercise_name (string, optional): one is required
  - profile_id (string, optional): exercise profile UUID
  - sets (array): [{ reps, weight, weight_unit, side?, bodyweight? }]

Returns the updated workout, same shape as uplifting_get_workout.`,
      inputSchema: {
        workout_id: z.string().uuid().describe("Workout UUID to add to"),
        exercise_id: z.string().uuid().optional().describe("Exercise UUID"),
        exercise_name: z
          .string()
          .min(1)
          .optional()
          .describe("Exercise name, if the UUID is unknown"),
        profile_id: z.string().uuid().optional().describe("Exercise profile UUID"),
        sets: z.array(setInputSchema).min(1).max(50).describe("Sets to append"),
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      const [workout] = await db
        .select()
        .from(workouts)
        .where(and(eq(workouts.id, args.workout_id), eq(workouts.userId, ctx.userId)))
        .limit(1);

      if (!workout) {
        return toolError(
          "Workout not found. Use uplifting_list_workouts to get valid workout IDs for this user.",
        );
      }

      const lookup = await resolveExercise(ctx.userId, args.exercise_id, args.exercise_name);
      if (!lookup.ok) return toolError(lookup.message);

      // Match the app's ordering rule: reuse the exercise's existing position
      // in this workout, otherwise append after the last exercise.
      const [existingGroup] = await db
        .select({ position: userSets.position })
        .from(userSets)
        .where(
          and(
            eq(userSets.workoutId, workout.id),
            eq(userSets.exerciseId, lookup.exercise.id),
            args.profile_id ? eq(userSets.profileId, args.profile_id) : isNull(userSets.profileId),
          ),
        )
        .limit(1);

      let position = existingGroup?.position;
      if (position === undefined) {
        const [{ maxPosition } = { maxPosition: null }] = await db
          .select({ maxPosition: max(userSets.position) })
          .from(userSets)
          .where(eq(userSets.workoutId, workout.id));
        position = (maxPosition ?? -1) + 1;
      }

      for (const set of args.sets) {
        await db.insert(userSets).values({
          userId: ctx.userId,
          workoutId: workout.id,
          exerciseId: lookup.exercise.id,
          profileId: args.profile_id,
          reps: set.reps,
          weight: String(set.weight),
          weightUnit: set.weight_unit,
          side: set.side,
          bodyweight: set.bodyweight !== undefined ? String(set.bodyweight) : undefined,
          position,
        });
      }

      const detail = await loadWorkoutDetail(workout);
      return respond(
        args.response_format,
        `Added ${args.sets.length} set(s) of ${lookup.exercise.name} to "${detail.name ?? "workout"}".`,
        detail,
      );
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:write",
    "uplifting_update_workout",
    {
      title: "Update workout details",
      description: `Change a workout's metadata: name, start/end time, gym, or privacy. Does not touch its sets — use uplifting_add_sets, uplifting_update_set or uplifting_delete_set for those.

Args:
  - workout_id (string): workout UUID
  - name / gym_location (string, optional)
  - start_time / end_time (string, optional): ISO timestamps
  - privacy ('private' | 'friends' | 'public', optional)

Returns the updated workout, same shape as uplifting_get_workout.`,
      inputSchema: {
        workout_id: z.string().uuid().describe("Workout UUID"),
        name: z.string().max(255).optional().describe("New session name"),
        start_time: isoDateSchema.optional().describe("New start timestamp"),
        end_time: isoDateSchema.optional().describe("New end timestamp"),
        gym_location: z.string().max(255).optional().describe("New gym name"),
        privacy: z
          .enum(["private", "friends", "public"])
          .optional()
          .describe("New privacy setting"),
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
      const [workout] = await db
        .select()
        .from(workouts)
        .where(and(eq(workouts.id, args.workout_id), eq(workouts.userId, ctx.userId)))
        .limit(1);

      if (!workout) return toolError("Workout not found.");

      const updates: Record<string, unknown> = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.gym_location !== undefined) updates.gymLocation = args.gym_location;
      if (args.privacy !== undefined) updates.privacy = args.privacy;
      if (args.start_time !== undefined) {
        const parsed = parseDate(args.start_time);
        if (!parsed)
          return toolError(`Error: 'start_time' is not a valid date: ${args.start_time}`);
        updates.startTime = parsed;
      }
      if (args.end_time !== undefined) {
        const parsed = parseDate(args.end_time);
        if (!parsed) return toolError(`Error: 'end_time' is not a valid date: ${args.end_time}`);
        updates.endTime = parsed;
      }

      if (Object.keys(updates).length === 0) {
        return toolError("Nothing to update — pass at least one field to change.");
      }

      const [updated] = await db
        .update(workouts)
        .set(updates)
        .where(eq(workouts.id, workout.id))
        .returning();

      const detail = await loadWorkoutDetail(updated);
      return respond(args.response_format, `Updated workout \`${updated.id}\`.`, detail);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:write",
    "uplifting_update_set",
    {
      title: "Update a set",
      description: `Correct a single logged set's reps or load.

Args:
  - set_id (string): set UUID, from uplifting_get_workout
  - reps (number, optional) / weight (number, optional) / weight_unit ('kg' | 'lbs', optional)

Returns { "id", "reps", "weight", "weight_unit", "side", "workout_id" }.`,
      inputSchema: {
        set_id: z.string().uuid().describe("Set UUID"),
        reps: z.number().int().min(0).max(1000).optional().describe("Corrected rep count"),
        weight: z.number().min(0).max(2000).optional().describe("Corrected load"),
        weight_unit: z.enum(["kg", "lbs"]).optional().describe("Corrected unit"),
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
      const [existing] = await db
        .select()
        .from(userSets)
        .where(and(eq(userSets.id, args.set_id), eq(userSets.userId, ctx.userId)))
        .limit(1);

      if (!existing) {
        return toolError("Set not found. Set IDs come from uplifting_get_workout.");
      }

      const updates: Record<string, unknown> = {};
      if (args.reps !== undefined) updates.reps = args.reps;
      if (args.weight !== undefined) updates.weight = String(args.weight);
      if (args.weight_unit !== undefined) updates.weightUnit = args.weight_unit;

      if (Object.keys(updates).length === 0) {
        return toolError("Nothing to update — pass reps, weight or weight_unit.");
      }

      const [updated] = await db
        .update(userSets)
        .set(updates)
        .where(eq(userSets.id, existing.id))
        .returning();

      const structured = {
        id: updated.id,
        workout_id: updated.workoutId,
        reps: updated.reps,
        weight: Number(updated.weight),
        weight_unit: updated.weightUnit,
        side: updated.side,
      };
      return respond(args.response_format, `Set updated to ${formatSet(structured)}.`, structured);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:write",
    "uplifting_delete_set",
    {
      title: "Delete a set",
      description: `Permanently delete one logged set. This cannot be undone.

Args:
  - set_id (string): set UUID, from uplifting_get_workout

Returns { "deleted": true, "id": string, "workout_id": string }.`,
      inputSchema: {
        set_id: z.string().uuid().describe("Set UUID to delete"),
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const [existing] = await db
        .select()
        .from(userSets)
        .where(and(eq(userSets.id, args.set_id), eq(userSets.userId, ctx.userId)))
        .limit(1);

      if (!existing) return toolError("Set not found — it may already have been deleted.");

      await db.delete(userSets).where(eq(userSets.id, existing.id));

      const structured = { deleted: true, id: existing.id, workout_id: existing.workoutId };
      return respond(args.response_format, `Deleted set \`${existing.id}\`.`, structured);
    },
  );

  scopedTool(
    server,
    ctx,
    "workouts:write",
    "uplifting_delete_workout",
    {
      title: "Delete a workout",
      description: `Permanently delete a workout and every set in it. This cannot be undone — confirm with the user before calling.

Args:
  - workout_id (string): workout UUID

Returns { "deleted": true, "id": string, "sets_deleted": number }.`,
      inputSchema: {
        workout_id: z.string().uuid().describe("Workout UUID to delete"),
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const [workout] = await db
        .select()
        .from(workouts)
        .where(and(eq(workouts.id, args.workout_id), eq(workouts.userId, ctx.userId)))
        .limit(1);

      if (!workout) return toolError("Workout not found — it may already have been deleted.");

      const structured = await db.transaction(async (tx) => {
        const deletedSets = await tx
          .delete(userSets)
          .where(eq(userSets.workoutId, workout.id))
          .returning({ id: userSets.id });
        await tx.delete(workouts).where(eq(workouts.id, workout.id));
        return { deleted: true, id: workout.id, sets_deleted: deletedSets.length };
      });

      return respond(
        args.response_format,
        `Deleted "${workout.name ?? "Untitled"}" and its ${structured.sets_deleted} sets.`,
        structured,
      );
    },
  );
}

// ── Shared loading ─────────────────────────────────────────────────────────

interface WorkoutTotals {
  total_sets: number;
  total_reps: number;
  total_volume: number;
  exercise_count: number;
}

/**
 * Per-workout totals for a batch of workouts.
 *
 * Unilateral sets are stored one row per side, so set counts follow the app's
 * convention of counting only the right side (or two-sided rows) to avoid
 * double counting. Volume deliberately counts both sides — the work was done.
 */
async function summarizeWorkouts(workoutIds: string[]): Promise<Map<string, WorkoutTotals>> {
  const rows = await sql`
    SELECT
      workout_id,
      COUNT(*) FILTER (WHERE side IS NULL OR side = 'R') as total_sets,
      COALESCE(SUM(reps), 0) as total_reps,
      COALESCE(SUM((CASE WHEN weight_unit = 'lbs' THEN weight * 0.453592 ELSE weight END) * reps), 0) as total_volume,
      COUNT(DISTINCT exercise_id) as exercise_count
    FROM user_sets
    WHERE workout_id = ANY(${workoutIds})
    GROUP BY workout_id
  `;

  return new Map(
    rows.map((row) => [
      row.workout_id as string,
      {
        total_sets: Number(row.total_sets),
        total_reps: Number(row.total_reps),
        total_volume: Number(row.total_volume),
        exercise_count: Number(row.exercise_count),
      },
    ]),
  );
}

export interface WorkoutDetail {
  id: string;
  name: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  kind: string;
  privacy: string;
  gym_location: string | null;
  total_sets: number;
  total_reps: number;
  total_volume_kg: number;
  exercises: {
    exercise_id: string;
    exercise_name: string;
    profile_id: string | null;
    is_unilateral: boolean;
    volume_kg: number;
    sets: {
      id: string;
      reps: number;
      weight: number;
      weight_unit: string;
      side: string | null;
      bodyweight: number | null;
    }[];
  }[];
}

export async function loadWorkoutDetail(
  workout: typeof workouts.$inferSelect,
): Promise<WorkoutDetail> {
  const rows = await sql`
    SELECT s.id, s.exercise_id, s.profile_id, s.reps, s.weight, s.weight_unit, s.side,
           s.bodyweight, s.position, s.created_at, e.name as exercise_name
    FROM user_sets s
    JOIN exercises e ON e.id = s.exercise_id
    WHERE s.workout_id = ${workout.id}
    ORDER BY s.position ASC, s.created_at ASC
  `;

  const groups = new Map<string, WorkoutDetail["exercises"][number]>();
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;

  for (const row of rows) {
    const key = `${row.exercise_id}|${row.profile_id ?? "null"}`;
    if (!groups.has(key)) {
      groups.set(key, {
        exercise_id: row.exercise_id as string,
        exercise_name: row.exercise_name as string,
        profile_id: (row.profile_id as string | null) ?? null,
        is_unilateral: false,
        volume_kg: 0,
        sets: [],
      });
    }

    const group = groups.get(key)!;
    const weight = Number(row.weight);
    const unit = row.weight_unit as string;
    const reps = row.reps as number;
    const side = (row.side as string | null) ?? null;
    const volume = toKg(weight, unit) * reps;

    if (side !== null) group.is_unilateral = true;
    group.volume_kg = round(group.volume_kg + volume);
    group.sets.push({
      id: row.id as string,
      reps,
      weight,
      weight_unit: unit,
      side,
      bodyweight: row.bodyweight === null ? null : Number(row.bodyweight),
    });

    if (side === null || side === "R") totalSets += 1;
    totalReps += reps;
    totalVolume += volume;
  }

  const end = workout.endTime ?? null;
  return {
    id: workout.id,
    name: workout.name,
    start_time: formatDateTime(workout.startTime),
    end_time: end ? formatDateTime(end) : null,
    duration_minutes: end ? Math.round((end.getTime() - workout.startTime.getTime()) / 60_000) : 0,
    kind: workout.kind,
    privacy: workout.privacy,
    gym_location: workout.gymLocation,
    total_sets: totalSets,
    total_reps: totalReps,
    total_volume_kg: round(totalVolume),
    exercises: [...groups.values()],
  };
}
