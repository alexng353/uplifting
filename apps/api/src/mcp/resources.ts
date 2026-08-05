/**
 * MCP resources — read-only snapshots a client can attach as context without
 * spending a tool call. Same data the tools expose, addressed by URI.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, desc, eq } from "drizzle-orm";
import { db, sql } from "../db";
import { workouts } from "../db/schema";
import { type McpContext, hasScope, round } from "./shared";
import { loadWorkoutDetail } from "./tools/workouts";

function jsonResource(uri: string, payload: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function registerResources(server: McpServer, ctx: McpContext): void {
  if (hasScope(ctx, "profile:read")) {
    server.registerResource(
      "profile",
      "uplifting://profile",
      {
        title: "Profile and settings",
        description: "The signed-in user's profile, app preferences and saved gyms.",
        mimeType: "application/json",
      },
      async (uri) => {
        const [user] = await sql`
          SELECT id, username, real_name, created_at FROM users WHERE id = ${ctx.userId}
        `;
        const [settings] = await sql`SELECT * FROM user_settings WHERE user_id = ${ctx.userId}`;
        const gyms = await sql`
          SELECT id, name FROM user_gyms WHERE user_id = ${ctx.userId} ORDER BY created_at ASC
        `;

        return jsonResource(uri.href, {
          user: user
            ? {
                id: user.id,
                username: user.username,
                real_name: user.real_name,
                member_since: new Date(user.created_at as string).toISOString(),
              }
            : null,
          settings: settings ?? null,
          gyms: gyms.map((gym) => ({ id: gym.id, name: gym.name })),
        });
      },
    );
  }

  if (!hasScope(ctx, "workouts:read")) return;

  server.registerResource(
    "recent-workouts",
    "uplifting://workouts/recent",
    {
      title: "Recent workouts",
      description: "The user's ten most recent sessions with per-session totals.",
      mimeType: "application/json",
    },
    async (uri) => {
      const rows = await sql`
        SELECT w.id, w.name, w.start_time, w.end_time, w.gym_location,
               COUNT(s.id) FILTER (WHERE s.side IS NULL OR s.side = 'R') as total_sets,
               COALESCE(SUM((CASE WHEN s.weight_unit = 'lbs' THEN s.weight * 0.453592 ELSE s.weight END) * s.reps), 0) as volume,
               COUNT(DISTINCT s.exercise_id) as exercise_count
        FROM workouts w LEFT JOIN user_sets s ON s.workout_id = w.id
        WHERE w.user_id = ${ctx.userId} AND w.kind = 'workout'
        GROUP BY w.id
        ORDER BY w.start_time DESC
        LIMIT 10
      `;

      return jsonResource(uri.href, {
        workouts: rows.map((row) => ({
          id: row.id,
          name: row.name,
          start_time: new Date(row.start_time as string).toISOString(),
          end_time: row.end_time ? new Date(row.end_time as string).toISOString() : null,
          gym_location: row.gym_location,
          total_sets: Number(row.total_sets),
          total_volume_kg: round(Number(row.volume)),
          exercise_count: Number(row.exercise_count),
        })),
      });
    },
  );

  server.registerResource(
    "personal-records",
    "uplifting://records",
    {
      title: "Personal records",
      description: "Best set per exercise, ranked by estimated one-rep max.",
      mimeType: "application/json",
    },
    async (uri) => {
      const rows = await sql`
        SELECT DISTINCT ON (s.exercise_id)
               s.exercise_id, e.name as exercise_name, s.weight, s.weight_unit, s.reps, w.start_time,
               (CASE WHEN s.weight_unit = 'lbs' THEN s.weight * 0.453592 ELSE s.weight END)
                 * (1 + LEAST(s.reps, 30)::numeric / 30) as est_1rm
        FROM user_sets s
        JOIN exercises e ON e.id = s.exercise_id
        JOIN workouts w ON w.id = s.workout_id
        WHERE s.user_id = ${ctx.userId} AND s.reps > 0 AND s.weight > 0
        ORDER BY s.exercise_id, est_1rm DESC
      `;

      const records = rows
        .map((row) => ({
          exercise_id: row.exercise_id,
          exercise_name: row.exercise_name,
          weight: Number(row.weight),
          weight_unit: row.weight_unit,
          reps: row.reps,
          estimated_1rm_kg: round(Number(row.est_1rm)),
          achieved_at: new Date(row.start_time as string).toISOString(),
        }))
        .sort((a, b) => b.estimated_1rm_kg - a.estimated_1rm_kg);

      return jsonResource(uri.href, { records });
    },
  );

  server.registerResource(
    "workout",
    new ResourceTemplate("uplifting://workout/{workoutId}", {
      list: async () => {
        const rows = await db
          .select({ id: workouts.id, name: workouts.name, startTime: workouts.startTime })
          .from(workouts)
          .where(eq(workouts.userId, ctx.userId))
          .orderBy(desc(workouts.startTime))
          .limit(25);

        return {
          resources: rows.map((row) => ({
            uri: `uplifting://workout/${row.id}`,
            name: `${row.name ?? "Untitled"} — ${row.startTime.toISOString().slice(0, 10)}`,
            mimeType: "application/json",
          })),
        };
      },
    }),
    {
      title: "Workout by ID",
      description: "One workout in full, including every exercise and set.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const workoutId = String(variables.workoutId);
      const [workout] = await db
        .select()
        .from(workouts)
        .where(and(eq(workouts.id, workoutId), eq(workouts.userId, ctx.userId)))
        .limit(1);

      if (!workout) throw new Error(`Workout ${workoutId} not found`);
      return jsonResource(uri.href, await loadWorkoutDetail(workout));
    },
  );
}
