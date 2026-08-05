import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { logger } from "./lib/logger";
import { authRoutes } from "./routes/auth";
import { workoutRoutes } from "./routes/workouts";
import { setRoutes } from "./routes/sets";
import { exerciseRoutes } from "./routes/exercises";
import { friendRoutes } from "./routes/friends";
import { userRoutes } from "./routes/users";
import { gymRoutes } from "./routes/gyms";
import { muscleRoutes } from "./routes/muscles";
import { syncRoutes } from "./routes/sync";
import { oauthRoutes } from "./routes/oauth";
import { mcpRoutes } from "./routes/mcp";

const app = new Elysia()
  .use(logger)
  .get("/", () => "ok 200")
  .get("/.well-known/health-check", () => "ok")
  // The MCP connector and its OAuth server are mounted at the origin root:
  // RFC 8414/9728 discovery lives under /.well-known, and the resource
  // identifier clients authorize against is the bare /mcp URL. They set their
  // own permissive CORS headers, so they are mounted outside the first-party
  // CORS policy below rather than sharing it.
  .use(oauthRoutes)
  .use(mcpRoutes)
  .group("/api/v1", (app) =>
    app
      .use(
        cors({
          origin: process.env.MOBILE_FRONTEND_URL || "http://localhost:8081",
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization"],
        }),
      )
      .use(authRoutes)
      .use(workoutRoutes)
      .use(setRoutes)
      .use(exerciseRoutes)
      .use(friendRoutes)
      .use(userRoutes)
      .use(gymRoutes)
      .use(muscleRoutes)
      .use(syncRoutes),
  )
  .listen(Number(process.env.PORT) || 8080);

console.log(`Listening on http://0.0.0.0:${app.server?.port}`);

export type App = typeof app;
