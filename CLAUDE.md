# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
bun install

# Start local Postgres
docker-compose up -d

# API development
bun api dev              # watch mode (port 8080)
bun api dev:hot          # hot reload mode
bun api start            # production mode

# Mobile development
bun mobile start         # Expo dev server
bun mobile ios           # iOS simulator
bun mobile android       # Android emulator

# Database
bun api db:push          # push schema to database
bun api db:generate      # generate migration from schema diff
bun api db:migrate       # run pending migrations
bun api db:studio        # open Drizzle Studio GUI
bun api db:seed          # seed database

# No test framework is configured
# No linter/formatter is configured
```

Environment: copy `apps/api/.env.example` to `apps/api/.env`. Required vars: `DATABASE_URL`, `JWT_SECRET`. Docker-compose provides a local Postgres (`postgres://uplifting:uplifting@localhost:5432/uplifting`).

## Architecture

Bun monorepo with two workspaces under `apps/`:

### `apps/api` — Elysia REST API

- **Elysia** web framework on **Bun** runtime, all routes under `/api/v1`
- **Drizzle ORM** with PostgreSQL — schema in `src/db/schema.ts`, migrations in `drizzle/`
- Routes in `src/routes/` — each file exports an Elysia plugin: auth, workouts, sets, exercises, friends, users, gyms, muscles, sync
- Auth: JWT Bearer tokens via `@elysiajs/jwt` + `@elysiajs/bearer`, helper in `src/lib/auth.ts`
- `App` type exported from `src/index.ts` — the mobile client imports this for end-to-end type safety

### `apps/mobile` — Expo React Native App

- **Expo SDK 54** + **Expo Router** (file-based routing in `app/`)
- **NativeWind** (Tailwind CSS for React Native) — dark mode via `useColorScheme()`
- **Eden Treaty** client (`lib/api.ts`) — type-safe HTTP client derived from the API's `App` type. The mobile app has `elysia` as a devDependency solely for this type import.
- **State management**:
  - React Context for auth (`hooks/useAuth.tsx`) and active workout (`hooks/useWorkout.tsx`)
  - TanStack React Query for server-fetched data
  - In-memory cache backed by AsyncStorage (`services/storage.ts`) for offline-first local state
- **Offline-first sync**: workouts are recorded locally, then synced to the server via `hooks/useSync.tsx` / `hooks/useSyncedSave.ts`. Pending workouts queue in local storage until sync succeeds.
- Components in `components/`, domain hooks in `hooks/` (~35 custom hooks)

### Key data flow

1. User logs sets locally → stored in `StoredWorkout` (via `useWorkout` context + `services/storage.ts`)
2. Workout finishes → queued as pending workout in local storage
3. Sync triggered → `useSync` sends workout to API via Eden Treaty
4. API persists to Postgres via Drizzle

### Adding a new API endpoint

1. Create or edit route file in `apps/api/src/routes/`
2. Register the Elysia plugin in `src/index.ts` if new
3. The mobile Eden Treaty client picks up types automatically (no codegen)

### Adding a new mobile screen

1. Add route file in `apps/mobile/app/` (Expo Router file-based routing)
2. Create hooks in `hooks/` for data fetching (React Query) or local state
3. Create components in `components/`

### Database schema changes

1. Edit `apps/api/src/db/schema.ts`
2. Run `bun api db:generate` to create migration
3. Run `bun api db:push` to apply
