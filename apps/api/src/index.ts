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

import { exerciseAgentRoutes, exerciseAgentService } from "./routes/exercise-agent";
import { startExerciseWorker } from "./exercise-agent/worker";

const app = new Elysia()
  .use(logger)
  .use(
    cors({
      origin: process.env.MOBILE_FRONTEND_URL || "http://localhost:8081",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .get("/", () => "ok 200")
  .get("/.well-known/health-check", () => "ok")
  .group("/api/v1", (app) =>
    app
      .use(authRoutes)
      .use(workoutRoutes)
      .use(setRoutes)
      .use(exerciseRoutes)
      .use(friendRoutes)
      .use(userRoutes)
      .use(gymRoutes)
      .use(muscleRoutes)
      .use(syncRoutes)
      .use(exerciseAgentRoutes),
  )
  .listen(Number(process.env.PORT ?? 8080));

const stopExerciseWorker = startExerciseWorker(exerciseAgentService);
let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  stopExerciseWorker();
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  await app.stop(true);
  await exerciseAgentService.sql.end({ timeout: 5 });
  process.exit(0);
}
process.on("SIGTERM", () => {
  void shutdown();
});
process.on("SIGINT", () => {
  void shutdown();
});

console.log(`Listening on http://0.0.0.0:${app.server?.port}`);

export type App = typeof app;
