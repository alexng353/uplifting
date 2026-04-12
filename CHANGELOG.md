# Changelog

All notable changes to Uplifting are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

_No unreleased changes._

## [1.0.1] - 2026-04-12

### Features

- Rest day management — log rest days, sync to server, cancel
  support, and server-side dedup
- Workout editor — edit past workouts via PagerView with full
  exercise/set editing and API support
  (`PUT /workouts/:workoutId`)
- Weight progression chart on exercise history screen
  (victory-native)
- Native iOS keyboard toolbar with Previous/Next/Done navigation
- Location capture button in gym manager modal
- Ref-based InputAccessoryView keyboard navigation (replacing
  react-native-keyboard-controller)

### Bug Fixes

- Normalize weight units to kg in all volume SQL queries
- Convert API volume (kg) to user's display unit in stats frontend
- Replace hardcoded `MUSCLE_GROUP_MAP` with DB-driven
  `major_group` column
- Preserve local settings when server returns null values
- Resolve exercise names in workout detail screen
- Replace `JSON.parse as T` with Zod validation in storage
- Remove unnecessary `as any` casts across screens, components,
  and bootstrap data
- Use correct Eden Treaty access patterns for dynamic paths
- Vertically center text in ExerciseSlide inputs, badges, and
  edit workout elements
- Fix `fontSize` style to prevent text shifting (was `text-base`)
- Add try/catch to edit workout save handler

### Refactors

- Extract pure workout mutation functions and unified
  `useWorkoutActions` hook
- Delegate `useWorkout` mutations to pure functions

## [1.0.0] - 2026-04-08

### Features

#### API (Elysia + Drizzle + PostgreSQL)

- Bun monorepo with Elysia REST API (`/api/v1`) and Expo React
  Native mobile app
- Drizzle ORM schema with 15 tables — users, workouts, sets,
  exercises, exercise profiles, favourites, friends, gyms,
  muscles, settings, and more
- Seed script for official muscles and exercises
- Full auth system — register, login, refresh, logout, delete
  account (JWT Bearer tokens)
- User routes — profile, settings (get/update), search
- Workout CRUD — create, update, delete, get, summary, streak,
  all-time stats
- Set CRUD — create, update, delete
- Exercise CRUD — full CRUD, profiles, favourites, history
- Friend routes — send/accept/reject requests, list, feed
- Gym routes — CRUD with location support
- Muscle and sync route endpoints
- Server-side workout sync with conflict handling

#### Mobile (Expo + React Native)

- Expo SDK 54 with Expo Router file-based navigation
- NativeWind (Tailwind CSS) styling with dark mode support
- Eden Treaty type-safe API client (end-to-end type safety
  from API types)
- Auth flow — login screen, secure token storage, auth context
- **Me screen** — week streak display, sync banner
- **Workout screen** — PagerView exercise slides, set logging,
  add/reorder/remove exercises, rest timer, finish workout
- **Friends screen** — activity feed, friend list, search,
  pending requests
- **Stats screen** — three tabs (summary, workouts, exercises),
  workout detail, exercise history
- **Settings screen** — profile, display preferences, exercise
  profiles, gym manager with location detection
- Dark mode — system/manual toggle, themed across all screens
- Offline-first architecture — workouts recorded locally via
  AsyncStorage, queued and synced to server
- Activity heartbeat tracking
- ~35 custom hooks for data fetching, mutations, and state
- TanStack React Query for server data management
