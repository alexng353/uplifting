# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project mode

This is a **let-it-ride** project, not a personal project. The global default
in `~/.claude/CLAUDE.md` says to give concept-level guidance and let Alex
write the code himself — that default does **not** apply here. In this repo,
Claude drives implementation: after design alignment, write the code, run
typecheck/lint/format, and commit + push. Alex still owns design decisions
and reviews diffs, but the keyboard belongs to Claude.

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

# Release (bumps version, generates changelog, tags, builds)
bun release:ios            # --patch (default)
bun release:ios --minor    # minor version bump
bun release:ios --major    # major version bump

# TestFlight (build-only, no version bump, EAS auto-increments build number)
bun testflight

# Utilities
bun changelog:dry        # preview changelog without writing
bun bump patch           # bump version only (patch|minor|major)

# No test framework is configured
# No linter/formatter is configured
```

Environment: copy `apps/api/.env.example` to `apps/api/.env`. Required vars: `DATABASE_URL`, `JWT_SECRET`. Docker-compose provides a local Postgres (`postgres://uplifting:uplifting@localhost:5432/uplifting`).

## Architecture

Bun monorepo with two workspaces under `apps/`:

### `apps/api` — Elysia REST API

- **Elysia** web framework on **Bun** runtime, first-party routes under `/api/v1`
- **Drizzle ORM** with PostgreSQL — schema in `src/db/schema.ts`, migrations in `drizzle/`
- Routes in `src/routes/` — each file exports an Elysia plugin: auth, workouts, sets, exercises, friends, users, gyms, muscles, sync
- Auth: JWT Bearer tokens via `@elysiajs/jwt` + `@elysiajs/bearer`, helper in `src/lib/auth.ts`
- `App` type exported from `src/index.ts` — the mobile client imports this for end-to-end type safety

### MCP connector (`/mcp`)

An MCP server for Claude web/desktop/mobile/Code lives at `POST /mcp`, mounted at
the origin root rather than under `/api/v1` (OAuth discovery must sit at
`/.well-known`, and the resource identifier clients authorize against is the bare
`/mcp` URL). See **[docs/mcp.md](docs/mcp.md)** for the full picture.

- `src/mcp/` — the server. `server.ts` builds a fresh `McpServer` per request with
  the caller's identity and scopes captured in the tool closures; `tools/`,
  `resources.ts`, `prompts.ts` register capabilities; `shared.ts` holds the
  scope-gated registration helper and response shaping.
- `src/lib/oauth/` + `src/routes/oauth.ts` — a self-contained OAuth 2.1
  authorization server (RFC 9728/8414/7591/7636/8707/9207/7009) with a
  server-rendered sign-in and consent screen, since there is no web frontend.
- MCP tokens are **opaque and audience-bound**, deliberately separate from the
  mobile JWTs — neither can be replayed against the other's endpoints.
- Set `PUBLIC_BASE_URL` in production; the token audience derives from it.

When adding an MCP tool: put it in the right `src/mcp/tools/` module, register it
through `scopedTool` with the scope it needs, and document the return shape in
the description — that description is the only spec the model gets.

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

### Preferences

- Prefer **React Query (TanStack Query)** for server communication — mutations, retries, cache invalidation. It gives a cleaner API and better retry surface than manual sync logic.
- New features that need server sync should use React Query mutations rather than custom sync hooks where possible.

### Database schema changes

All schema migrations go through drizzle-kit. Never hand-write SQL files in `drizzle/`.

1. Edit `apps/api/src/db/schema.ts` (the single source of truth)
2. Run `bun api db:generate` (`drizzle-kit generate`) to diff schema and create a migration SQL file
3. Run `bun api db:migrate` (`drizzle-kit migrate`) to apply pending migrations

For data-only changes (e.g., backfilling column values), write a standalone Bun script — drizzle-kit does not handle data migrations.

### Releasing

`bun release:ios [patch|minor|major]` handles the full flow:

1. Bumps version in `apps/mobile/app.json` and `apps/mobile/package.json`
2. Generates changelog entry from conventional commits since last tag
3. Commits, tags (`vX.Y.Z`), and pushes
4. Builds and optionally submits to App Store Connect

The changelog generator (`scripts/generate-changelog.ts`) parses conventional commits and strips the `[agent]` prefix. Use conventional commit format: `feat:`, `fix:`, `refactor:`, `perf:`, `docs:`, `chore:`, etc.
