# Uplifting

An offline-first workout tracker. Log sets at the gym without thinking about
the network; the app syncs to the server when it can.

iOS app (Expo / React Native) + a thin Elysia API on Bun + Postgres.

## Stack

- **Mobile** — Expo SDK 54, Expo Router, NativeWind, TanStack Query, MMKV-backed
  offline cache, Eden Treaty client.
- **API** — Bun, Elysia, Drizzle ORM, JWT auth with rotating refresh tokens.
- **DB** — Postgres (Docker Compose for local).
- **Type safety** — the mobile client imports the API's `App` type directly; no
  codegen between client and server.

## Quick start

```bash
# Prereqs: Bun, Docker, Xcode (for iOS).
bun install
cp apps/api/.env.example apps/api/.env   # set JWT_SECRET, leave the rest
docker compose up -d                     # local Postgres
bun api db:migrate                       # apply schema
bun api dev                              # API on :8080
bun mobile ios                           # boots the simulator
```

The API listens on `http://localhost:8080`. Configure the mobile target via
`EXPO_PUBLIC_API_URL` if you're not on the simulator.

## Repository layout

```
apps/
  api/      Elysia REST API, routes under /api/v1
  mobile/   Expo app, file-based routing in app/
docs/       Reference material (e.g. the Superpowers skill set)
scripts/    Repo-level scripts (changelog gen, version bump)
```

## Releasing

```bash
bun release:ios          # bumps patch, tags vX.Y.Z, builds via EAS, submits
bun release:ios --minor  # or --major
bun testflight           # build-only, EAS auto-increments build number
```

Conventional commits drive the changelog. Use `feat:` / `fix:` / `refactor:` /
etc. See `CHANGELOG.md` for the running history.

## Further reading

- **`CLAUDE.md`** — architecture, conventions, and instructions for Claude Code
  agents working on the repo.
- **`apps/mobile/app.json`** — app config (icon, splash, bundle ID).
- **`apps/api/drizzle/`** — generated migrations.

<!--
TODO: things that would make this page better
- Hero screenshot at the top (workout-in-progress screen) so the README
  isn't a wall of text.
- Animated GIF of the core loop: log a set → finish workout → suggestion
  surfaces next session. Shows the offline-first sync visually.
- A small gallery further down: home, exercise picker with fuzzy search,
  stats page, friends feed. Light + dark for each.
- Architecture diagram (mobile ↔ API ↔ Postgres, plus the offline
  cache → sync queue flow). Mermaid renders fine on GitHub.
- Badges row: latest tagged version, build status (once CI exists),
  Expo SDK version, Bun version.
- Feature checklist near the top so a drive-by reader knows what's in.
- TestFlight invite link once the build is publicly shareable.
- Acknowledgements: shadcn (the design influence), Elysia, Expo.
- "Why another tracker?" paragraph — the offline-first / sub-second-log
  pitch in plain English.
-->
