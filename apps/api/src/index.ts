import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { workoutRoutes } from "./routes/workouts";
import { setRoutes } from "./routes/sets";
import { exerciseRoutes } from "./routes/exercises";
import { friendRoutes } from "./routes/friends";
import { userRoutes } from "./routes/users";
import { gymRoutes } from "./routes/gyms";
import { muscleRoutes } from "./routes/muscles";
import { syncRoutes } from "./routes/sync";

const app = new Elysia()
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
      .use(syncRoutes),
  )
  .listen(Number(process.env.PORT) || 8080);

console.log(`Listening on http://0.0.0.0:${app.server?.port}`);

export type App = typeof app;
