/**
 * Profile, settings, gyms and social tools.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eq } from "drizzle-orm";
import { db, sql } from "../../db";
import { userGyms, userSettings } from "../../db/schema";
import {
  type McpContext,
  formatDate,
  respond,
  responseFormatSchema,
  scopedTool,
  toolError,
} from "../shared";

export function registerProfileTools(server: McpServer, ctx: McpContext): void {
  scopedTool(
    server,
    ctx,
    "profile:read",
    "uplifting_get_profile",
    {
      title: "Get profile and settings",
      description: `The signed-in user's profile, app settings and saved gyms. Read this before logging workouts if you need to know their preferred weight unit or default privacy.

Args:
  - response_format ('markdown' | 'json')

Returns JSON of shape:
  {
    "user": { "id": string, "username": string, "real_name": string,
              "email_verified": boolean, "member_since": string },
    "settings": { "display_unit": string | null, "default_privacy": string,
                  "default_rest_timer_seconds": number, "max_workout_duration_minutes": number,
                  "color_scheme": string, "current_gym_id": string | null },
    "gyms": [{ "id": string, "name": string, "is_current": boolean }]
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
      const [userRows, settingsRows, gymRows] = await Promise.all([
        sql`SELECT id, username, real_name, email_verified, created_at FROM users WHERE id = ${ctx.userId}`,
        sql`SELECT * FROM user_settings WHERE user_id = ${ctx.userId}`,
        sql`SELECT id, name FROM user_gyms WHERE user_id = ${ctx.userId} ORDER BY created_at ASC`,
      ]);

      if (userRows.length === 0) return toolError("Profile not found.");

      const user = userRows[0];
      const settings = settingsRows[0];
      const currentGymId = (settings?.current_gym_id as string | null) ?? null;

      const structured = {
        user: {
          id: user.id as string,
          username: user.username as string,
          real_name: user.real_name as string,
          email_verified: user.email_verified as boolean,
          member_since: new Date(user.created_at as string).toISOString(),
        },
        settings: {
          display_unit: (settings?.display_unit as string | null) ?? null,
          default_privacy: (settings?.default_privacy as string) ?? "friends",
          default_rest_timer_seconds: Number(settings?.default_rest_timer_seconds ?? 90),
          max_workout_duration_minutes: Number(settings?.max_workout_duration_minutes ?? 120),
          color_scheme: (settings?.color_scheme as string) ?? "system",
          current_gym_id: currentGymId,
        },
        gyms: gymRows.map((gym) => ({
          id: gym.id as string,
          name: gym.name as string,
          is_current: gym.id === currentGymId,
        })),
      };

      const lines = [
        `# ${structured.user.real_name} (@${structured.user.username})`,
        "",
        `Member since ${formatDate(structured.user.member_since)}`,
        `Preferred unit: ${structured.settings.display_unit ?? "not set (kg)"}`,
        `Default privacy: ${structured.settings.default_privacy}`,
        `Rest timer: ${structured.settings.default_rest_timer_seconds}s`,
        "",
        structured.gyms.length ? "## Gyms" : "No gyms saved.",
        ...structured.gyms.map(
          (gym) => `- ${gym.name}${gym.is_current ? " *(current)*" : ""} \`${gym.id}\``,
        ),
      ];

      return respond(args.response_format, lines.join("\n"), structured);
    },
  );

  scopedTool(
    server,
    ctx,
    "profile:write",
    "uplifting_update_settings",
    {
      title: "Update app settings",
      description: `Change the user's app preferences. Only the fields you pass are modified.

Args:
  - display_unit ('kg' | 'lbs', optional): preferred display unit
  - default_privacy ('private' | 'friends' | 'public', optional): default for new workouts
  - default_rest_timer_seconds (number, optional): 0-3600
  - max_workout_duration_minutes (number, optional): 1-1440; how long before a session is considered abandoned
  - color_scheme ('system' | 'light' | 'dark', optional)
  - current_gym_id (string, optional): UUID of a gym from uplifting_get_profile

Returns the updated settings object.`,
      inputSchema: {
        display_unit: z.enum(["kg", "lbs"]).optional().describe("Preferred weight unit"),
        default_privacy: z
          .enum(["private", "friends", "public"])
          .optional()
          .describe("Default privacy for new workouts"),
        default_rest_timer_seconds: z
          .number()
          .int()
          .min(0)
          .max(3600)
          .optional()
          .describe("Rest timer length"),
        max_workout_duration_minutes: z
          .number()
          .int()
          .min(1)
          .max(1440)
          .optional()
          .describe("Maximum session length before it counts as abandoned"),
        color_scheme: z.enum(["system", "light", "dark"]).optional().describe("App colour scheme"),
        current_gym_id: z.string().uuid().optional().describe("Gym to mark as current"),
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
      const updates: Record<string, unknown> = {};
      if (args.display_unit !== undefined) updates.displayUnit = args.display_unit;
      if (args.default_privacy !== undefined) updates.defaultPrivacy = args.default_privacy;
      if (args.default_rest_timer_seconds !== undefined) {
        updates.defaultRestTimerSeconds = args.default_rest_timer_seconds;
      }
      if (args.max_workout_duration_minutes !== undefined) {
        updates.maxWorkoutDurationMinutes = args.max_workout_duration_minutes;
      }
      if (args.color_scheme !== undefined) updates.colorScheme = args.color_scheme;
      if (args.current_gym_id !== undefined) {
        const [gym] = await db
          .select({ id: userGyms.id })
          .from(userGyms)
          .where(eq(userGyms.id, args.current_gym_id))
          .limit(1);
        if (!gym)
          return toolError("Gym not found. Use uplifting_get_profile to list valid gym IDs.");
        updates.currentGymId = args.current_gym_id;
      }

      if (Object.keys(updates).length === 0) {
        return toolError("Nothing to update — pass at least one setting to change.");
      }

      const [result] = await db
        .insert(userSettings)
        .values({ userId: ctx.userId, ...updates } as typeof userSettings.$inferInsert)
        .onConflictDoUpdate({ target: userSettings.userId, set: updates })
        .returning();

      const structured = {
        display_unit: result.displayUnit,
        default_privacy: result.defaultPrivacy,
        default_rest_timer_seconds: result.defaultRestTimerSeconds,
        max_workout_duration_minutes: result.maxWorkoutDurationMinutes,
        color_scheme: result.colorScheme,
        current_gym_id: result.currentGymId,
      };

      return respond(
        args.response_format,
        `Updated settings: ${Object.keys(updates).join(", ")}.`,
        structured,
      );
    },
  );

  scopedTool(
    server,
    ctx,
    "profile:write",
    "uplifting_create_gym",
    {
      title: "Save a gym",
      description: `Add a gym to the user's saved list, optionally with coordinates.

Args:
  - name (string): gym name
  - latitude / longitude (number, optional): location, for automatic gym detection in the app

Returns { "id": string, "name": string, "latitude": number | null, "longitude": number | null }.`,
      inputSchema: {
        name: z.string().min(1).max(255).describe("Gym name"),
        latitude: z.number().min(-90).max(90).optional().describe("Latitude in decimal degrees"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .optional()
          .describe("Longitude in decimal degrees"),
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
      const [gym] = await db
        .insert(userGyms)
        .values({
          userId: ctx.userId,
          name: args.name,
          latitude: args.latitude,
          longitude: args.longitude,
        })
        .returning();

      const structured = {
        id: gym.id,
        name: gym.name,
        latitude: gym.latitude,
        longitude: gym.longitude,
      };
      return respond(args.response_format, `Saved gym "${gym.name}" (\`${gym.id}\`).`, structured);
    },
  );
}

export function registerSocialTools(server: McpServer, ctx: McpContext): void {
  scopedTool(
    server,
    ctx,
    "social:read",
    "uplifting_list_friends",
    {
      title: "List friends",
      description: `The user's accepted friends, plus whether each is currently online or mid-workout.

Online and workout status respect each friend's own privacy settings — a friend who has disabled sharing always reports false.

Args:
  - include_pending (boolean): also return incoming friend requests (default false)
  - response_format ('markdown' | 'json')

Returns JSON of shape:
  {
    "friends": [{ "user_id": string, "username": string, "real_name": string,
                  "friends_since": string, "is_online": boolean, "is_in_workout": boolean,
                  "current_workout_name": string | null }],
    "pending_requests": [{ "user_id": string, "username": string, "real_name": string, "requested_at": string }]
  }`,
      inputSchema: {
        include_pending: z.boolean().default(false).describe("Include incoming friend requests"),
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
        SELECT u.id as user_id, u.username, u.real_name, f.created_at,
               ua.last_seen_at, ua.current_workout_started_at, w.name as current_workout_name,
               us.share_online_status, us.share_workout_status, us.max_workout_duration_minutes
        FROM friendships f
        JOIN users u ON u.id = CASE WHEN f.user_id = ${ctx.userId} THEN f.friend_id ELSE f.user_id END
        LEFT JOIN user_activity ua ON ua.user_id = u.id
        LEFT JOIN user_settings us ON us.user_id = u.id
        LEFT JOIN workouts w ON w.id = ua.current_workout_id
        WHERE (f.user_id = ${ctx.userId} OR f.friend_id = ${ctx.userId}) AND f.status = 'accepted'
        ORDER BY f.created_at DESC
      `;

      const now = Date.now();
      const friends = rows.map((row) => {
        const lastSeen = row.last_seen_at ? new Date(row.last_seen_at as string).getTime() : 0;
        const workoutStarted = row.current_workout_started_at
          ? new Date(row.current_workout_started_at as string).getTime()
          : 0;
        const maxDuration = Number(row.max_workout_duration_minutes ?? 120);

        const isOnline =
          Boolean(row.share_online_status) && lastSeen > 0 && now - lastSeen < 5 * 60_000;
        const isInWorkout =
          Boolean(row.share_workout_status) &&
          workoutStarted > 0 &&
          now - workoutStarted < maxDuration * 60_000;

        return {
          user_id: row.user_id as string,
          username: row.username as string,
          real_name: row.real_name as string,
          friends_since: new Date(row.created_at as string).toISOString(),
          is_online: isOnline,
          is_in_workout: isInWorkout,
          current_workout_name: isInWorkout
            ? ((row.current_workout_name as string | null) ?? null)
            : null,
        };
      });

      const pending = args.include_pending
        ? await sql`
            SELECT u.id as user_id, u.username, u.real_name, f.created_at
            FROM friendships f JOIN users u ON u.id = f.user_id
            WHERE f.friend_id = ${ctx.userId} AND f.status = 'pending'
            ORDER BY f.created_at DESC
          `
        : [];

      const structured = {
        friends,
        pending_requests: pending.map((row) => ({
          user_id: row.user_id as string,
          username: row.username as string,
          real_name: row.real_name as string,
          requested_at: new Date(row.created_at as string).toISOString(),
        })),
      };

      if (friends.length === 0 && structured.pending_requests.length === 0) {
        return respond(args.response_format, "No friends yet.", structured);
      }

      const lines = [`# Friends (${friends.length})`, ""];
      for (const friend of friends) {
        const status = friend.is_in_workout
          ? ` — training now${friend.current_workout_name ? `: ${friend.current_workout_name}` : ""}`
          : friend.is_online
            ? " — online"
            : "";
        lines.push(`- **${friend.real_name}** (@${friend.username})${status}`);
      }
      if (structured.pending_requests.length > 0) {
        lines.push("", `## Pending requests (${structured.pending_requests.length})`, "");
        for (const request of structured.pending_requests) {
          lines.push(`- **${request.real_name}** (@${request.username})`);
        }
      }

      return respond(args.response_format, lines.join("\n"), structured);
    },
  );
}
