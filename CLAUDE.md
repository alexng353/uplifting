# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Uplifting is an offline-first fitness tracking app with a Rust/Axum API and a React/Ionic mobile frontend. The monorepo is coordinated via a root Justfile (not npm/cargo workspaces). An OpenAPI spec symlinked at `mobile/openapi.json -> ../api/openapi.json` bridges the two halves — the API generates it, the mobile app consumes it to auto-generate a typed client.

## Commands

All commands run from the repo root via `just`:

```bash
just setup              # First-time: install deps, start DB, run migrations
just dev                # Start API (cargo watch :8080) + mobile (Vite :5173)
just dev-api            # API only
just dev-mobile         # Mobile only

just build              # Build both (API release + Vite)
just test               # Mobile unit tests (vitest)
just test-mobile-e2e    # Mobile E2E tests (cypress)

just lint               # Lint both (cargo clippy -D warnings + biome check --write)
just lint-api           # API only
just lint-mobile        # Mobile only
just fmt-api            # cargo fmt

just db-start           # PostgreSQL via docker compose on :5401
just db-stop
just db-reset           # Destroys data
just migrate            # Run migrations + sqlx prepare
```

Mobile-specific (run from `mobile/`):

```bash
bun run check           # TypeScript type-check (tsgo --noEmit)
bun run build           # tsgo --noEmit && vite build
bun run lint            # biome check --write
```

Regenerate OpenAPI client after API struct changes:

```bash
cd api && cargo run -- --generate-spec
cd mobile && bun scripts/postinstall.ts --force
```

## Before Committing

1. `just lint` (clippy + biome)
2. `bun run check` (in `mobile/`) — TypeScript type-check
3. `bun run build` (in `mobile/`) — full build

## Architecture

### API (`api/`)

Rust, Axum 0.8, Tokio, SQLx (compile-time checked queries against PostgreSQL).

- `src/main.rs` — Router setup, OpenAPI generation via utoipa, CORS, tracing
- `src/v1/` — Versioned endpoint modules: `auth`, `exercises`, `friends`, `gyms`, `muscles`, `sets`, `sync`, `users`, `workouts`
- `src/structs/` — Request/response types and DB models
- `src/extractors/` — Custom Axum extractors (e.g., JWT auth)
- `src/error.rs` — Unified error types → HTTP responses
- `src/state.rs` — `AppState` (DB pool, JWT key, Mailgun config)
- `migrations/` — SQLx migrations (UUID PKs, decimal weights, chrono timestamps)
- `.sqlx/` — Prepared query cache for offline/CI builds

Auth: JWT (HMAC-SHA2) + Argon2 password hashing. Email via Mailgun.

### Mobile (`mobile/`)

React 19, Ionic 8, TypeScript (strict), Vite, Capacitor for native.

- `src/pages/` — Tab-based: `workout`, `friends`, `me`, `stats`, `settings`, `login`
- `src/hooks/` — Data hooks (React Query) + `useSync.tsx` (offline sync), `useWorkout.tsx` (workout state)
- `src/services/local-storage.ts` — IndexedDB persistence (idb-keyval)
- `src/lib/` — Auto-generated API client from OpenAPI spec (@hey-api/openapi-ts)
- `src/components/` — Shared UI components

### Offline-First Data Flow

1. All mutations write to IndexedDB immediately
2. A sync queue tracks pending changes
3. When online, `useSync` batches changes to `POST /api/v1/sync`
4. Server is authoritative (last-write-wins with timestamps)
5. On app startup, `useBootstrap` pulls a full data snapshot

## Data Model Change Checklist

Any schema change must propagate across all layers (see `.cursor/rules/data-sync.mdc`):

1. **Database** — Add migration in `api/migrations/`, update SQL queries
2. **API structs** (`api/src/structs/`) — Update sync/request/response types, regenerate OpenAPI spec
3. **Mobile types** (`mobile/src/services/local-storage.ts`) — Update `Stored*` types
4. **Sync transform** (`mobile/src/hooks/useSync.tsx`) — Update `toRemote` mapping
5. **Regenerate client** — `cd mobile && bun scripts/postinstall.ts --force`

## Code Style

- **API:** Standard Rust formatting (`cargo fmt`), clippy with `-D warnings`
- **Mobile:** Biome — tabs, double quotes, organize imports on save
- **Package manager:** Bun (not npm/yarn/pnpm)
