# Uplifting 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1:1 clone of the Uplifting fitness app, replacing Rust/Axum + Ionic/React with Elysia/Drizzle + Expo/React Native.

**Architecture:** Bun monorepo with two apps: `apps/api` (Elysia + Drizzle + Postgres) and `apps/mobile` (Expo + React Native + NativeWind). Eden Treaty provides type-safe API client from Elysia types. MMKV for local storage, Expo Router for navigation.

**Tech Stack:** Bun, Elysia, Drizzle ORM, PostgreSQL, Expo SDK 53, React Native, NativeWind, Eden Treaty, MMKV, Expo Router, Expo SecureStore

---

## Task 1: Monorepo & Infrastructure Setup

**Files:**

- Create: `package.json`
- Create: `bunfig.toml`
- Create: `docker-compose.yml`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.env.example`
- Create: `apps/mobile/package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`

- [ ] **Step 1: Create root workspace package.json**

```json
{
  "name": "uplifting-2",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "api": "bun --filter api",
    "mobile": "bun --filter mobile"
  }
}
```

- [ ] **Step 2: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
.env
.expo/
ios/
android/
*.tsbuildinfo
```

- [ ] **Step 4: Create docker-compose.yml**

```yaml
services:
  db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: uplifting
      POSTGRES_PASSWORD: uplifting
      POSTGRES_DB: uplifting
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://uplifting:uplifting@db:5432/uplifting
      JWT_SECRET: dev-secret-change-in-production
      PORT: "8080"
      MAILGUN_API_KEY: ${MAILGUN_API_KEY:-dummy}
      MAILGUN_DOMAIN: ${MAILGUN_DOMAIN:-dummy}
      MAILGUN_BASE_URL: ${MAILGUN_BASE_URL:-https://api.mailgun.net}
      MAILGUN_FROM_EMAIL: ${MAILGUN_FROM_EMAIL:-noreply@example.com}
    depends_on:
      - db

volumes:
  pgdata:
```

- [ ] **Step 5: Create apps/api/package.json**

```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun src/db/seed.ts"
  },
  "dependencies": {
    "drizzle-orm": "^0.44.0",
    "elysia": "^1.3.0",
    "@elysiajs/cors": "^1.3.0",
    "@elysiajs/jwt": "^1.3.0",
    "@elysiajs/bearer": "^1.3.0",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "drizzle-kit": "^0.31.0",
    "typescript": "^5.9.0"
  }
}
```

- [ ] **Step 6: Create apps/api/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 7: Create apps/api/.env.example**

```
DATABASE_URL=postgres://uplifting:uplifting@localhost:5432/uplifting
JWT_SECRET=dev-secret-change-in-production
PORT=8080
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_BASE_URL=https://api.mailgun.net
MAILGUN_FROM_EMAIL=noreply@example.com
MOBILE_FRONTEND_URL=http://localhost:8081
```

- [ ] **Step 8: Create apps/api/Dockerfile**

```dockerfile
FROM oven/bun:1.2 AS base
WORKDIR /app

FROM base AS install
COPY apps/api/package.json apps/api/bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM base AS build
COPY apps/api/package.json apps/api/bun.lock* ./
RUN bun install --frozen-lockfile
COPY apps/api/src ./src
COPY apps/api/drizzle ./drizzle
COPY apps/api/drizzle.config.ts ./

FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/package.json ./

ENV PORT=8080
EXPOSE 8080
CMD ["bun", "src/index.ts"]
```

- [ ] **Step 9: Install API dependencies**

Run: `cd apps/api && bun install`

- [ ] **Step 10: Commit**

```bash
git init
git add -A
git commit -m "[agent] feat: initialize monorepo with API and infrastructure

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Drizzle Schema

**Files:**

- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/index.ts`
- Create: `apps/api/drizzle.config.ts`

- [ ] **Step 1: Create drizzle.config.ts**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 2: Create apps/api/src/db/schema.ts**

All 16 tables + the user_activity table. Use pgEnum for exercise_type. All timestamps as TIMESTAMPTZ. Match every column, constraint, default, and index from the original migrations.

```typescript
import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Enums
export const exerciseTypeEnum = pgEnum("exercise_type", [
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
]);

// Tables
export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  realName: varchar("real_name", { length: 255 }).notNull(),
  username: varchar({ length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const muscles = pgTable("muscles", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  scientificName: varchar("scientific_name", { length: 255 }),
  majorGroup: varchar("major_group", { length: 255 }),
  minorGroup: varchar("minor_group", { length: 255 }).notNull(),
});

export const exercises = pgTable("exercises", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  exerciseType: exerciseTypeEnum("exercise_type").notNull(),
  official: boolean().notNull().default(false),
  authorId: uuid("author_id").references(() => users.id),
  description: text(),
  movementPattern: varchar("movement_pattern", { length: 50 }),
  muscleGroup: varchar("muscle_group", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exerciseMuscleRelations = pgTable("exercise_muscle_relations", {
  id: uuid().primaryKey().defaultRandom(),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id),
  muscleId: uuid("muscle_id")
    .notNull()
    .references(() => muscles.id),
  isPrimary: boolean("is_primary").notNull(),
});

export const workouts = pgTable(
  "workouts",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    name: varchar({ length: 255 }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    privacy: varchar({ length: 20 }).notNull().default("friends"),
    gymLocation: varchar("gym_location", { length: 255 }),
    kind: varchar({ length: 20 }).notNull().default("workout"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_workouts_user_kind").on(t.userId, t.kind)],
);

export const exerciseProfiles = pgTable(
  "exercise_profiles",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.exerciseId, t.name)],
);

export const userSets = pgTable("user_sets", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id),
  profileId: uuid("profile_id").references(() => exerciseProfiles.id),
  reps: integer().notNull(),
  weight: decimal({ precision: 10, scale: 2 }).notNull(),
  weightUnit: varchar("weight_unit", { length: 3 }).notNull().default("kg"),
  side: varchar({ length: 1 }),
  bodyweight: decimal({ precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const friendships = pgTable(
  "friendships",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    friendId: uuid("friend_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar({ length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.friendId)],
);

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayUnit: varchar("display_unit", { length: 3 }),
  maxWorkoutDurationMinutes: integer("max_workout_duration_minutes").notNull().default(120),
  defaultRestTimerSeconds: integer("default_rest_timer_seconds").notNull().default(90),
  defaultPrivacy: varchar("default_privacy", { length: 20 }).notNull().default("friends"),
  shareGymLocation: boolean("share_gym_location").notNull().default(true),
  shareOnlineStatus: boolean("share_online_status").notNull().default(true),
  shareWorkoutStatus: boolean("share_workout_status").notNull().default(true),
  shareWorkoutHistory: boolean("share_workout_history").notNull().default(true),
  currentGymId: uuid("current_gym_id").references(() => userGyms.id, { onDelete: "set null" }),
});

export const favouriteExercises = pgTable(
  "favourite_exercises",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.exerciseId)],
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar({ length: 6 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_email_verification_tokens_user_id").on(t.userId),
    index("idx_email_verification_tokens_token").on(t.token),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar({ length: 6 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_password_reset_tokens_user_id").on(t.userId),
    index("idx_password_reset_tokens_token").on(t.token),
  ],
);

export const userActivity = pgTable(
  "user_activity",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    currentWorkoutId: uuid("current_workout_id").references(() => workouts.id, {
      onDelete: "set null",
    }),
    currentWorkoutStartedAt: timestamp("current_workout_started_at", { withTimezone: true }),
  },
  (t) => [index("idx_user_activity_last_seen").on(t.lastSeenAt)],
);

export const userGyms = pgTable(
  "user_gyms",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_user_gyms_user_id").on(t.userId)],
);

export const userGymProfileMappings = pgTable(
  "user_gym_profile_mappings",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gymId: uuid("gym_id")
      .notNull()
      .references(() => userGyms.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.userId, t.gymId, t.exerciseId),
    index("idx_gym_profile_mappings_user_gym").on(t.userId, t.gymId),
  ],
);
```

- [ ] **Step 3: Create apps/api/src/db/index.ts**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { max: 5 });

export const db = drizzle(client, { schema });
export type DB = typeof db;
```

- [ ] **Step 4: Generate and push the initial migration**

Run: `cd apps/api && bun run db:push`

Verify: Tables exist in Postgres via `docker compose exec db psql -U uplifting -c '\dt'`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "[agent] feat: add Drizzle schema with all 16 tables

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Seed Data (Official Exercises + Muscles)

**Files:**

- Create: `apps/api/src/db/seed.ts`

The original app has ~60 muscles and ~160+ official exercises with muscle relations. Copy the seed data from the original migrations (migrations 1, 5, 10-13).

- [ ] **Step 1: Create seed.ts**

Read the INSERT statements from `/home/alex/code/uplifting/api/migrations/20260115105435_official_gym_data.sql` and the other exercise-insert migrations. Convert them to Drizzle insert calls. The seed script should:

1. Insert all muscles with scientific_name, major_group, minor_group
2. Insert all official exercises
3. Insert all exercise_muscle_relations

Run with `bun src/db/seed.ts`.

- [ ] **Step 2: Run seed and verify**

Run: `cd apps/api && bun run db:seed`
Verify: `docker compose exec db psql -U uplifting -c 'SELECT COUNT(*) FROM muscles; SELECT COUNT(*) FROM exercises;'`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "[agent] feat: add seed data for muscles and official exercises

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Elysia App Core (Entry Point, Auth Middleware, Error Handling)

**Files:**

- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/lib/auth.ts`
- Create: `apps/api/src/lib/errors.ts`
- Create: `apps/api/src/lib/mailgun.ts`
- Create: `apps/api/src/lib/password.ts`

- [ ] **Step 1: Create apps/api/src/lib/password.ts**

```typescript
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: "argon2id" });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
```

- [ ] **Step 2: Create apps/api/src/lib/errors.ts**

```typescript
import { error } from "elysia";

export function unauthorized(message = "Unauthorized") {
  return error(401, { error: message });
}

export function forbidden(message: string) {
  return error(403, { error: message });
}

export function notFound(message: string) {
  return error(404, { error: message });
}

export function badRequest(message: string) {
  return error(400, { error: message });
}
```

- [ ] **Step 3: Create apps/api/src/lib/auth.ts**

JWT plugin setup and user extraction derive.

```typescript
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const jwtPlugin = new Elysia({ name: "jwt" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: "7d",
    }),
  )
  .use(bearer());

export const authPlugin = new Elysia({ name: "auth" })
  .use(jwtPlugin)
  .derive(async ({ jwt, bearer, set }) => {
    if (!bearer) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    const payload = await jwt.verify(bearer);
    if (!payload) {
      set.status = 401;
      throw new Error("JWT has expired. Please log in again.");
    }
    const userId = payload.sub as string;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      set.status = 401;
      throw new Error("User not found");
    }
    return { userId, user };
  });
```

- [ ] **Step 4: Create apps/api/src/lib/mailgun.ts**

```typescript
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY!;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN!;
const MAILGUN_BASE_URL = process.env.MAILGUN_BASE_URL!;
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL!;

export async function sendEmail(to: string, subject: string, text: string) {
  const form = new FormData();
  form.append("from", MAILGUN_FROM_EMAIL);
  form.append("to", to);
  form.append("subject", subject);
  form.append("text", text);

  const response = await fetch(`${MAILGUN_BASE_URL}/v3/${MAILGUN_DOMAIN}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Mailgun error: ${response.status} ${await response.text()}`);
  }
}

export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
```

- [ ] **Step 5: Create apps/api/src/index.ts**

```typescript
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
```

- [ ] **Step 6: Create stub route files**

Create empty route files so the app compiles. Each exports an Elysia instance:

```typescript
// apps/api/src/routes/auth.ts (and same pattern for all 9 route files)
import { Elysia } from "elysia";
export const authRoutes = new Elysia({ prefix: "/auth" });
```

Create stubs for: `auth.ts`, `workouts.ts`, `sets.ts`, `exercises.ts`, `friends.ts`, `users.ts`, `gyms.ts`, `muscles.ts`, `sync.ts`

- [ ] **Step 7: Verify API starts**

Run: `cd apps/api && bun run dev`
Verify: `curl http://localhost:8080/.well-known/health-check` → "ok"

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "[agent] feat: add Elysia app core with auth, error handling, and route stubs

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Auth Routes

**Files:**

- Modify: `apps/api/src/routes/auth.ts`

- [ ] **Step 1: Implement all 6 auth endpoints**

```typescript
import { Elysia, t } from "elysia";
import { db } from "../db";
import { users, emailVerificationTokens, passwordResetTokens } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import { jwtPlugin, authPlugin } from "../lib/auth";
import { hashPassword, verifyPassword } from "../lib/password";
import { sendEmail, generateVerificationCode } from "../lib/mailgun";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin)
  // POST /signup
  .post(
    "/signup",
    async ({ jwt, body }) => {
      const passwordHash = await hashPassword(body.password);
      const [user] = await db
        .insert(users)
        .values({
          realName: body.real_name,
          username: body.username,
          email: body.email,
          passwordHash,
        })
        .returning();
      const token = await jwt.sign({
        sub: user.id,
        username: user.username,
        real_name: user.realName,
        email: user.email,
      });
      return token;
    },
    {
      body: t.Object({
        real_name: t.String(),
        username: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    },
  )
  // POST /login
  .post(
    "/login",
    async ({ jwt, body, set }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .limit(1);
      if (!user) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }
      const valid = await verifyPassword(body.password, user.passwordHash);
      if (!valid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }
      const token = await jwt.sign({
        sub: user.id,
        username: user.username,
        real_name: user.realName,
        email: user.email,
      });
      return token;
    },
    {
      body: t.Object({ username: t.String(), password: t.String() }),
    },
  )
  // POST /send-verification (auth required)
  .use(authPlugin)
  .post("/send-verification", async ({ userId }) => {
    const [user] = await db
      .select({ email: users.email, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, userId));
    if (user.emailVerified) return "Email already verified";
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await db.insert(emailVerificationTokens).values({ userId, token: code, expiresAt });
    await sendEmail(
      user.email,
      "Verify Your Email Address",
      `Your verification code is: ${code}\n\nThis code expires in 30 minutes.`,
    );
    return "Verification code sent";
  })
  // POST /verify-email
  .post(
    "/verify-email",
    async ({ userId, body, set }) => {
      const [token] = await db
        .select()
        .from(emailVerificationTokens)
        .where(
          and(
            eq(emailVerificationTokens.userId, userId),
            eq(emailVerificationTokens.token, body.code),
            gt(emailVerificationTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);
      if (!token) {
        set.status = 401;
        return { error: "Invalid or expired code" };
      }
      await db.update(users).set({ emailVerified: true }).where(eq(users.id, userId));
      await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
      return "Email verified successfully";
    },
    {
      body: t.Object({ code: t.String() }),
    },
  )
  // POST /request-password-change
  .post("/request-password-change", async ({ userId, set }) => {
    const [user] = await db
      .select({ email: users.email, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, userId));
    if (!user.emailVerified) {
      set.status = 401;
      return { error: "Email not verified" };
    }
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.insert(passwordResetTokens).values({ userId, token: code, expiresAt });
    await sendEmail(
      user.email,
      "Password Change Verification Code",
      `Your verification code is: ${code}\n\nThis code expires in 15 minutes.`,
    );
    return "Verification code sent";
  })
  // POST /change-password
  .post(
    "/change-password",
    async ({ userId, body, set }) => {
      const [token] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.userId, userId),
            eq(passwordResetTokens.token, body.code),
            gt(passwordResetTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);
      if (!token) {
        set.status = 401;
        return { error: "Invalid or expired code" };
      }
      const passwordHash = await hashPassword(body.new_password);
      await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
      return "Password changed successfully";
    },
    {
      body: t.Object({ code: t.String(), new_password: t.String() }),
    },
  );
```

- [ ] **Step 2: Verify endpoints**

Run: `curl -X POST http://localhost:8080/api/v1/auth/signup -H 'Content-Type: application/json' -d '{"real_name":"Test","username":"test","email":"test@test.com","password":"pass123"}'`
Expected: JWT token string

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "[agent] feat: implement auth routes (signup, login, verification, password reset)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: User Routes

**Files:**

- Modify: `apps/api/src/routes/users.ts`

- [ ] **Step 1: Implement all user endpoints**

GET /me, PUT /me, DELETE /me, GET /settings, PUT /settings, GET /search

Port the exact SQL logic from the Rust handlers. Key details:

- GET /settings: if no row exists, INSERT defaults and return
- PUT /settings: UPSERT with ON CONFLICT
- GET /search: case-insensitive LIKE on username, exclude self, limit 20
- DELETE /me: cascading deletes handle related data

- [ ] **Step 2: Verify**

Run: `curl -H 'Authorization: Bearer <token>' http://localhost:8080/api/v1/users/me`

- [ ] **Step 3: Commit**

---

## Task 7: Workout Routes

**Files:**

- Modify: `apps/api/src/routes/workouts.ts`

- [ ] **Step 1: Implement all workout endpoints**

POST create, GET list (paginated), GET :id (with sets grouped by exercise), PUT :id, DELETE :id, GET :id/summary, GET /streak, GET /all-time-stats

Key SQL to port carefully:

- **GET :id**: Fetch workout + all sets, group by (exercise_id, profile_id), detect is_unilateral
- **GET :id/summary**: Aggregate query with volume = SUM(weight \* reps), sets filtered by side
- **GET /streak**: Gaps-and-islands algorithm with DENSE_RANK
- **GET /all-time-stats**: Multiple queries - totals, top exercises, muscle group volume with category mapping

All queries use raw SQL via `db.execute(sql\`...\`)` for the complex window functions.

- [ ] **Step 2: Verify**

- [ ] **Step 3: Commit**

---

## Task 8: Set Routes

**Files:**

- Modify: `apps/api/src/routes/sets.ts`

- [ ] **Step 1: Implement set CRUD**

POST /workouts/:workoutId/sets, PUT /:setId, DELETE /:setId

Each operation checks ownership. Create inserts with all fields (exercise_id, profile_id, reps, weight, weight_unit, side, bodyweight).

- [ ] **Step 2: Commit**

---

## Task 9: Exercise Routes

**Files:**

- Modify: `apps/api/src/routes/exercises.ts`

- [ ] **Step 1: Implement all exercise endpoints**

GET list (with filters: type, muscle, muscle_group, search), POST create (admin), GET types, GET :id (with details + PR + favourite status), GET :id/history, GET /used (top exercises), PUT :id (admin)

Profile sub-routes: GET /profiles, GET /:id/profiles, POST /:id/profiles, PUT /:id/profiles/:profileId

Favourite sub-routes: GET /favourites, POST /:id/favourite, DELETE /:id/favourite

Key details:

- GET list: LEFT JOIN to muscles for filtering, show official + user-authored
- GET :id: 5 separate queries (exercise, primary muscles, secondary muscles, is_favourite, personal_record)
- GET :id/history: Group sets by workout, ordered by date

- [ ] **Step 2: Commit**

---

## Task 10: Friend Routes

**Files:**

- Modify: `apps/api/src/routes/friends.ts`

- [ ] **Step 1: Implement all friend endpoints**

POST /send, GET / (with status), GET /requests, PUT /respond/:id, DELETE /:id, GET /feed, POST /activity, GET /workouts/:userId

Key complexity:

- GET /: UNION query for bidirectional friendships + JOIN user_activity + user_settings for online/workout status
- GET /feed: Join workouts where privacy='friends' and friendship exists, with aggregate stats
- POST /activity: UPSERT into user_activity with last_seen_at and current_workout info
- GET /workouts/:userId: Check friendship exists AND share_workout_history enabled

- [ ] **Step 2: Commit**

---

## Task 11: Gym Routes

**Files:**

- Modify: `apps/api/src/routes/gyms.ts`

- [ ] **Step 1: Implement gym CRUD + profile mappings**

GET list, POST create, PUT :id, DELETE :id, GET /:id/profile-mappings, PUT /:id/profile-mappings

Profile mappings use UPSERT (ON CONFLICT DO UPDATE).

- [ ] **Step 2: Commit**

---

## Task 12: Muscle Routes

**Files:**

- Modify: `apps/api/src/routes/muscles.ts`

- [ ] **Step 1: Implement muscle endpoints**

GET /all, GET /groups (distinct major_group + minor_group), POST /create (admin only)

- [ ] **Step 2: Commit**

---

## Task 13: Sync Routes

**Files:**

- Modify: `apps/api/src/routes/sync.ts`

- [ ] **Step 1: Implement sync endpoints**

GET /bootstrap, POST /workout

Key complexity:

- **GET /bootstrap**: Fetch gyms + profiles + gym_profile_mappings + previous_sets (window function: DENSE_RANK to get most recent workout's sets per exercise+profile)
- **POST /workout**: Transaction that creates workout + inserts all sets, returns updated previous_sets

The previous_sets query uses:

```sql
WITH ranked_sets AS (
  SELECT s.exercise_id, s.profile_id, s.reps, s.weight, s.weight_unit, s.side, s.created_at,
    DENSE_RANK() OVER (
      PARTITION BY s.exercise_id, COALESCE(s.profile_id, '00000000-0000-0000-0000-000000000000')
      ORDER BY w.end_time DESC
    ) as workout_rank
  FROM user_sets s JOIN workouts w ON s.workout_id = w.id
  WHERE s.user_id = $1
)
SELECT * FROM ranked_sets WHERE workout_rank = 1
ORDER BY exercise_id, profile_id, created_at ASC
```

Group results by key: `{exercise_id}_{profile_id || 'default'}`

- [ ] **Step 2: Verify bootstrap**

Run: `curl -H 'Authorization: Bearer <token>' http://localhost:8080/api/v1/sync/bootstrap`

- [ ] **Step 3: Commit**

---

## Task 14: Expo Mobile App Setup

**Files:**

- Create: `apps/mobile/` (Expo project)
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/tailwind.config.js`
- Create: `apps/mobile/global.css`
- Create: `apps/mobile/metro.config.js`
- Create: `apps/mobile/babel.config.js`

- [ ] **Step 1: Initialize Expo app**

Run from `apps/`: `bunx create-expo-app mobile --template blank-typescript`

- [ ] **Step 2: Install dependencies**

```bash
cd apps/mobile
bunx expo install expo-router expo-secure-store expo-location expo-haptics \
  react-native-mmkv react-native-pager-view react-native-safe-area-context \
  react-native-screens react-native-svg react-native-gesture-handler \
  @react-native-community/netinfo
bun add @tanstack/react-query nativewind tailwindcss @elysiajs/eden fuse.js
bun add -d @types/react react-native-reanimated
```

- [ ] **Step 3: Configure NativeWind (tailwind.config.js)**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 4: Configure Metro for NativeWind**

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

- [ ] **Step 5: Create global.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Configure Expo Router in app.json**

```json
{
  "expo": {
    "name": "Uplifting",
    "slug": "uplifting",
    "scheme": "uplifting",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android"],
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Allow Uplifting to use your location to detect nearby gyms."
        }
      ]
    ]
  }
}
```

- [ ] **Step 7: Verify Expo starts**

Run: `cd apps/mobile && bunx expo start`

- [ ] **Step 8: Commit**

---

## Task 15: Mobile Storage & API Client

**Files:**

- Create: `apps/mobile/services/storage.ts`
- Create: `apps/mobile/services/auth-storage.ts`
- Create: `apps/mobile/lib/api.ts`

- [ ] **Step 1: Create storage.ts (MMKV-based, same API as original idb-keyval layer)**

Port every type and function from the original `local-storage.ts`. Replace `idb-keyval` get/set/del/clear with MMKV's synchronous API. Keep every type: StoredWorkout, StoredSet, StoredSettings, StoredExercise, StoredProfile, StoredGym, GymProfileMapping, etc.

```typescript
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

function getJSON<T>(key: string): T | null {
  const raw = storage.getString(key);
  return raw ? JSON.parse(raw) : null;
}

function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

function remove(key: string): void {
  storage.delete(key);
}

// ... then export all the same functions: getCurrentWorkout, setCurrentWorkout, etc.
```

- [ ] **Step 2: Create auth-storage.ts**

```typescript
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
```

- [ ] **Step 3: Create lib/api.ts (Eden Treaty client)**

```typescript
import { treaty } from "@elysiajs/eden";
import type { App } from "../../../api/src/index";
import { getToken } from "../services/auth-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

export const api = treaty<App>(API_URL, {
  headers: async () => {
    const token = await getToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  },
});
```

- [ ] **Step 4: Commit**

---

## Task 16: Mobile Root Layout & Auth

**Files:**

- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/login.tsx`
- Create: `apps/mobile/hooks/useAuth.tsx`

- [ ] **Step 1: Create useAuth.tsx**

Port from original. Context provider with isAuthenticated, isLoading, login, logout. Uses SecureStore for token persistence.

- [ ] **Step 2: Create \_layout.tsx (root layout)**

```tsx
import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

const queryClient = new QueryClient();

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "login";
    if (!isAuthenticated && !inAuth) router.replace("/login");
    else if (isAuthenticated && inAuth) router.replace("/(tabs)/me");
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Create login.tsx**

Port the Login page. Two forms (login + signup) toggled by state. Uses TextInput + Pressable. Calls api.api.v1.auth.signup/login.post(). On success, calls login() from useAuth.

- [ ] **Step 4: Commit**

---

## Task 17: Tab Navigation

**Files:**

- Create: `apps/mobile/app/(tabs)/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/me.tsx` (stub)
- Create: `apps/mobile/app/(tabs)/friends.tsx` (stub)
- Create: `apps/mobile/app/(tabs)/workout.tsx` (stub)
- Create: `apps/mobile/app/(tabs)/stats/index.tsx` (stub)
- Create: `apps/mobile/app/(tabs)/settings/index.tsx` (stub)

- [ ] **Step 1: Create tab layout**

```tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="me"
        options={{
          title: "Me",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create stub screens** (each just renders a View with the screen name as text)

- [ ] **Step 3: Commit**

---

## Task 18: Port All Hooks

**Files:**

- Create: `apps/mobile/hooks/useWorkout.tsx`
- Create: `apps/mobile/hooks/useSettings.tsx`
- Create: `apps/mobile/hooks/useBootstrap.ts`
- Create: `apps/mobile/hooks/useSync.tsx`
- Create: `apps/mobile/hooks/useOnline.tsx`
- Create: `apps/mobile/hooks/useMe.ts`
- Create: `apps/mobile/hooks/useWorkouts.ts`
- Create: `apps/mobile/hooks/useExercises.ts`
- Create: `apps/mobile/hooks/useExerciseHistory.ts`
- Create: `apps/mobile/hooks/useExerciseProfiles.ts`
- Create: `apps/mobile/hooks/useExerciseSuggestions.ts`
- Create: `apps/mobile/hooks/useFavouriteExercises.ts`
- Create: `apps/mobile/hooks/usePreviousSets.ts`
- Create: `apps/mobile/hooks/useAllTimeStats.ts`
- Create: `apps/mobile/hooks/useStreak.ts`
- Create: `apps/mobile/hooks/useFriendsList.ts`
- Create: `apps/mobile/hooks/useFeed.ts`
- Create: `apps/mobile/hooks/usePendingFriendRequests.ts`
- Create: `apps/mobile/hooks/useSendFriendRequest.ts`
- Create: `apps/mobile/hooks/useRespondFriendRequest.ts`
- Create: `apps/mobile/hooks/useFriendWorkouts.ts`
- Create: `apps/mobile/hooks/useGyms.ts`
- Create: `apps/mobile/hooks/useCurrentGym.ts`
- Create: `apps/mobile/hooks/useGymProfileSuggestion.ts`
- Create: `apps/mobile/hooks/useSyncedSave.ts`
- Create: `apps/mobile/hooks/useCurrentUser.ts`
- Create: `apps/mobile/hooks/useAuth.mutations.ts`
- Create: `apps/mobile/services/bootstrap.ts`
- Create: `apps/mobile/services/geolocation.ts`

- [ ] **Step 1: Port useOnline.tsx**

Replace `navigator.onLine` with `@react-native-community/netinfo`:

```tsx
import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useOnline() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
  }, []);
  return { isOnline };
}
```

- [ ] **Step 2: Port all React Query hooks**

These translate nearly 1:1. Replace the auto-generated `@hey-api/client-fetch` calls with Eden Treaty calls. Example for useMe:

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data, error } = await api.api.v1.users.me.get();
      if (error) throw error;
      return data;
    },
  });
}
```

Same pattern for: useWorkouts, useExercises, useExerciseHistory, useAllTimeStats, useStreak, useFeed, useFriendsList, usePendingFriendRequests, useFriendWorkouts, useGyms, useFavouriteExercises, useExerciseProfiles.

- [ ] **Step 3: Port mutation hooks**

useAuth.mutations (signup, password reset, verify), useSendFriendRequest, useRespondFriendRequest, useSyncedSave — all follow same pattern: `useMutation` with Eden Treaty calls.

- [ ] **Step 4: Port context hooks**

useWorkout.tsx (workout state machine — biggest hook, manages current workout in MMKV), useSettings.tsx (settings context, syncs local + server), useBootstrap.ts + bootstrap.ts service.

- [ ] **Step 5: Port useExerciseSuggestions, useGymProfileSuggestion, useCurrentGym, usePreviousSets**

These read from MMKV and do local computation. Port the weighting algorithm for exercise suggestions exactly.

- [ ] **Step 6: Port geolocation.ts**

Replace Capacitor Geolocation with expo-location.

- [ ] **Step 7: Commit**

---

## Task 19: Me Screen

**Files:**

- Modify: `apps/mobile/app/(tabs)/me.tsx`
- Create: `apps/mobile/components/WeekStreak.tsx`
- Create: `apps/mobile/components/SyncBanner.tsx`

- [ ] **Step 1: Implement Me screen**

Port from original Me.tsx. Shows:

- User profile (name, avatar)
- This week's stats (workouts, rest days, total minutes)
- WeekStreak component (7-day visual)
- Streak counter
- Sync banner (when offline or pending sync)
- Recent workout list

Use NativeWind classes. Replace Ionic components:

- `IonPage/IonContent` → `SafeAreaView + ScrollView`
- `IonRefresher` → `RefreshControl`
- `IonCard` → `View` with shadow styling

- [ ] **Step 2: Port WeekStreak component**

Already pure React — just replace HTML div/span with View/Text + NativeWind classes.

- [ ] **Step 3: Port SyncBanner**

Shows offline indicator + sync button when pending workouts exist.

- [ ] **Step 4: Commit**

---

## Task 20: Workout Screen

**Files:**

- Modify: `apps/mobile/app/(tabs)/workout.tsx`
- Create: `apps/mobile/components/workout/ExerciseSlide.tsx`
- Create: `apps/mobile/components/workout/AddExerciseSlide.tsx`
- Create: `apps/mobile/components/workout/WorkoutSummary.tsx`
- Create: `apps/mobile/components/workout/RestTimer.tsx`
- Create: `apps/mobile/components/workout/ReorderModal.tsx`

- [ ] **Step 1: Implement workout screen with PagerView**

Replace Swiper with `react-native-pager-view`. Same slide structure:

- Slides 0..N-1: ExerciseSlide for each exercise
- Slide N: AddExerciseSlide

Header bar: workout timer, finish button, reorder button.

```tsx
import PagerView from "react-native-pager-view";

// Inside component:
<PagerView
  ref={pagerRef}
  style={{ flex: 1 }}
  initialPage={lastSlideIndex}
  onPageSelected={(e) => setActiveSlide(e.nativeEvent.position)}
>
  {workout.exercises.map((exercise, i) => (
    <View key={exercise.exerciseId}>
      <ExerciseSlide exercise={exercise} />
    </View>
  ))}
  <View key="add">
    <AddExerciseSlide />
  </View>
</PagerView>;
```

- [ ] **Step 2: Implement ExerciseSlide**

Port from original. Shows: exercise name/type, set table (reps, weight, previous), add set button, profile selector. Replace Ionic inputs with TextInput, Ionic buttons with Pressable.

- [ ] **Step 3: Implement AddExerciseSlide**

Exercise search with Fuse.js fuzzy search. Sorting: favourites first, then suggestions, then alphabetical. Filter by type, muscle, muscle group. Uses FlatList with section headers.

- [ ] **Step 4: Implement WorkoutSummary modal**

Shows after tapping Finish: exercises performed, total volume, duration, sets count. Save/Cancel buttons.

- [ ] **Step 5: Implement RestTimer**

Alert-style modal with countdown. Uses setInterval.

- [ ] **Step 6: Implement ReorderModal**

Drag-to-reorder exercise list. Use `react-native-gesture-handler` + `react-native-reanimated` for drag interactions.

- [ ] **Step 7: Commit**

---

## Task 21: Friends Screen

**Files:**

- Modify: `apps/mobile/app/(tabs)/friends.tsx`
- Create: `apps/mobile/components/friends/FeedCard.tsx`
- Create: `apps/mobile/components/friends/FriendSearch.tsx`
- Create: `apps/mobile/components/friends/FriendsList.tsx`
- Create: `apps/mobile/components/friends/FriendProfile.tsx`
- Create: `apps/mobile/components/friends/PendingRequests.tsx`

- [ ] **Step 1: Implement Friends screen**

Segmented control with Feed / Friends / Requests tabs. Replace IonSegment with a custom SegmentedControl component.

- [ ] **Step 2: Implement FeedCard**

Shows friend's workout: name, avatar, workout name, total volume, duration, gym location.

- [ ] **Step 3: Implement FriendSearch modal**

TextInput + FlatList of search results. Send friend request button.

- [ ] **Step 4: Implement FriendsList, FriendProfile, PendingRequests**

- [ ] **Step 5: Commit**

---

## Task 22: Stats Screen

**Files:**

- Modify: `apps/mobile/app/(tabs)/stats/index.tsx`
- Create: `apps/mobile/app/(tabs)/stats/workout/[workoutId].tsx`
- Create: `apps/mobile/app/(tabs)/stats/exercise/[exerciseId].tsx`

- [ ] **Step 1: Implement Stats index**

Three tabs: This Week, All Time, Exercises. Uses segmented control.

- This Week: workouts/rest days, total time, exercise count
- All Time: total volume, sets, reps, workouts, time, top exercises, muscle groups
- Exercises: FlatList of favourite exercises with set counts, infinite scroll

- [ ] **Step 2: Implement WorkoutDetail screen**

Shows workout exercises + sets, volume, duration. Navigated from Stats or Me.

- [ ] **Step 3: Implement ExerciseHistory screen**

Shows exercise PR history, per-session breakdown. Chart with victory-native or simple custom chart.

- [ ] **Step 4: Commit**

---

## Task 23: Settings Screen

**Files:**

- Modify: `apps/mobile/app/(tabs)/settings/index.tsx`
- Create: `apps/mobile/app/(tabs)/settings/exercise-profiles.tsx`
- Create: `apps/mobile/app/(tabs)/settings/rep-ranges.tsx`
- Create: `apps/mobile/components/settings/GymManagerModal.tsx`

- [ ] **Step 1: Implement Settings screen**

Scrollable list of settings sections:

- Display: unit (kg/lbs picker), rest timer, max workout duration, default privacy
- Privacy: toggles for sharing gym location, online status, workout status, workout history
- Gyms: list + manage modal
- Exercise profiles: link to sub-screen
- Rep ranges: link to sub-screen
- Account: edit username, verify email, change password, delete account, logout

Replace IonToggle with Switch, IonSelect with a custom picker, IonInput with TextInput.

- [ ] **Step 2: Implement GymManagerModal**

CRUD for user gyms. List, add (name + optional coordinates), edit, delete.

- [ ] **Step 3: Implement exercise-profiles.tsx**

List profiles grouped by exercise. Add/rename/delete.

- [ ] **Step 4: Implement rep-ranges.tsx**

Customizable rep range colors. List of ranges with color pickers.

- [ ] **Step 5: Commit**

---

## Task 24: ActivityTracker Component

**Files:**

- Create: `apps/mobile/components/ActivityTracker.tsx`

- [ ] **Step 1: Implement ActivityTracker**

Port from original. Runs on 60-second interval, POSTs to /api/v1/friends/activity with current workout info. Only runs when authenticated.

- [ ] **Step 2: Add to root layout**

Render `<ActivityTracker />` inside the authenticated section of the app.

- [ ] **Step 3: Commit**

---

## Task 25: Final Integration & Polish

**Files:**

- Various touch-ups across all screens

- [ ] **Step 1: Wire up WorkoutProvider in (tabs) layout**

Wrap tab navigator with WorkoutProvider context.

- [ ] **Step 2: Wire up bootstrap**

Add useBootstrap to the authenticated layout, show loading spinner during initial data sync.

- [ ] **Step 3: Test full flow**

1. Start docker-compose (DB + API)
2. Start Expo dev server
3. Sign up → land on Me tab
4. Start workout → add exercise → log sets → finish
5. Check Stats shows the workout
6. Check sync works (kill server, log workout, restart server, verify sync)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "[agent] feat: complete 1:1 clone of Uplifting app

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```
