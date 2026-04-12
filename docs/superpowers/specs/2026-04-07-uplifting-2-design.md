# Uplifting 2 — Full Rewrite Design Spec

1:1 clone of Uplifting (Rust/Axum + Ionic/React) into Expo + Elysia + Drizzle.

## Stack

- **Frontend:** Expo (React Native) + Expo Router + NativeWind (Tailwind)
- **Backend:** Elysia (Bun) + Eden Treaty (type-safe client)
- **Database:** Drizzle ORM + PostgreSQL
- **Monorepo:** Bun workspaces
- **Infrastructure:** Dockerfile + docker-compose

## Repo Structure

```
uplifting-2/
├── apps/
│   ├── api/                    # Elysia backend
│   │   ├── src/
│   │   │   ├── index.ts        # Elysia app entry, CORS, JWT plugin
│   │   │   ├── db/
│   │   │   │   ├── index.ts    # Drizzle connection (postgres-js)
│   │   │   │   └── schema.ts   # All 16 tables as pgTable definitions
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts     # signup, login, password reset, email verify
│   │   │   │   ├── workouts.ts # CRUD, summary, streak, all-time stats
│   │   │   │   ├── sets.ts     # CRUD
│   │   │   │   ├── exercises.ts# CRUD, profiles, favorites, history, types
│   │   │   │   ├── friends.ts  # list, requests, feed, activity
│   │   │   │   ├── users.ts    # me, update, settings, search, delete
│   │   │   │   ├── gyms.ts     # CRUD, profile mappings
│   │   │   │   ├── muscles.ts  # list, groups
│   │   │   │   └── sync.ts     # workout sync, bootstrap
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts     # JWT extraction + verification
│   │   │   └── lib/
│   │   │       ├── mailgun.ts  # Email sending
│   │   │       └── password.ts # bcrypt hashing
│   │   ├── drizzle/            # Generated migrations
│   │   ├── drizzle.config.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   └── mobile/                 # Expo app
│       ├── app/
│       │   ├── _layout.tsx     # Root layout (QueryClient, AuthProvider)
│       │   ├── login.tsx       # Login/signup screen
│       │   └── (tabs)/
│       │       ├── _layout.tsx # Tab navigator
│       │       ├── me.tsx
│       │       ├── friends.tsx
│       │       ├── workout.tsx
│       │       ├── stats/
│       │       │   ├── index.tsx
│       │       │   ├── workout/[workoutId].tsx
│       │       │   └── exercise/[exerciseId].tsx
│       │       └── settings/
│       │           ├── index.tsx
│       │           ├── exercise-profiles.tsx
│       │           └── rep-ranges.tsx
│       ├── components/
│       ├── hooks/              # All hooks ported from original
│       ├── services/
│       │   ├── storage.ts      # MMKV-based local storage
│       │   ├── bootstrap.ts    # Initial data load
│       │   └── auth-storage.ts # SecureStore for JWT
│       ├── lib/
│       │   └── api.ts          # Eden Treaty client setup
│       ├── app.json
│       ├── tailwind.config.js
│       └── package.json
├── docker-compose.yml          # API + Postgres
├── package.json                # Workspace root
└── tsconfig.json               # Shared base config
```

## Database Schema (Drizzle)

All 16 tables from the original, mapped 1:1:

1. **users** — id, real_name, username, email, password_hash, avatar_url, email_verified, is_admin, created_at
2. **workouts** — id, user_id, name, start_time, end_time, privacy, gym_location, kind, created_at
3. **user_sets** — id, user_id, exercise_id, workout_id, profile_id, reps, weight, weight_unit, side, bodyweight, created_at
4. **exercises** — id, name, exercise_type, official, author_id, description, created_at
5. **exercise_muscle_relations** — id, exercise_id, muscle_id, is_primary
6. **muscles** — id, name
7. **body_parts** — id, name
8. **muscle_bodypart_relations** — id, muscle_id, body_part_id
9. **exercise_profiles** — id, user_id, exercise_id, name (UNIQUE user+exercise+name)
10. **friendships** — id, user_id, friend_id, status, created_at (UNIQUE user+friend)
11. **user_settings** — user_id (PK), display_unit, max_workout_duration_minutes, default_rest_timer_seconds, default_privacy, share_gym_location, share_online_status, share_workout_status, share_workout_history, current_gym_id
12. **user_gyms** — id, user_id, name, latitude, longitude, created_at
13. **user_gym_profile_mappings** — id, user_id, gym_id, exercise_id, profile_id (UNIQUE user+gym+exercise)
14. **favourite_exercises** — id, user_id, exercise_id, created_at (UNIQUE user+exercise)
15. **email_verification_tokens** — id, user_id, token, expires_at, created_at
16. **password_reset_tokens** — id, user_id, token, expires_at, created_at

## API Endpoints (all under /api/v1)

Exact same routes as original Axum API:

**Auth:** POST signup, login, password/request, password/change, verify/send, verify/verify
**Workouts:** GET list, GET :id, POST create, PUT :id, DELETE :id, GET :id/summary, GET streak, GET all-time-stats
**Sets:** POST create, PUT :id, DELETE :id
**Exercises:** GET list, POST create, GET types, GET :id, GET :id/history, GET used, PUT :id, GET/POST/PUT/DELETE profiles, GET/POST/DELETE favorites
**Friends:** GET list, GET requests, POST send, PUT respond/:id, DELETE :id, GET feed, POST activity, GET workouts/:userId
**Users:** GET me, PUT me, DELETE me, GET settings, PUT settings, GET search
**Gyms:** GET list, POST create, PUT :id, DELETE :id, GET/POST profile-mappings
**Muscles:** GET list, GET groups
**Sync:** POST workout, GET bootstrap

## Mobile Screens (1:1)

5-tab layout: Me, Friends, Workout, Stats, Settings + Login

### Tech Mapping

| Original                   | New                       |
| -------------------------- | ------------------------- |
| Ionic components           | React Native + NativeWind |
| Swiper (horizontal pager)  | PagerView                 |
| idb-keyval (IndexedDB)     | react-native-mmkv         |
| React Router v5            | Expo Router               |
| Recharts                   | Victory Native            |
| Capacitor                  | Expo modules              |
| @hey-api/openapi-ts client | Eden Treaty               |

## Auth Flow

- JWT via `@elysiajs/jwt` plugin
- Password hashing via `Bun.password` (bcrypt/argon2)
- Token stored in expo-secure-store on mobile
- Sent as `Authorization: Bearer <token>` header
- Eden Treaty client configured with auth interceptor
