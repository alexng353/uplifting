import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  doublePrecision,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────────

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

// ── Users ──────────────────────────────────────────────────────────────────

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

// ── Muscles ────────────────────────────────────────────────────────────────

export const muscles = pgTable("muscles", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  scientificName: varchar("scientific_name", { length: 255 }),
  majorGroup: varchar("major_group", { length: 255 }),
  minorGroup: varchar("minor_group", { length: 255 }).notNull(),
});

// ── Exercises ──────────────────────────────────────────────────────────────

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

// ── Exercise–Muscle Relations ──────────────────────────────────────────────

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

// ── Workouts ───────────────────────────────────────────────────────────────

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
  },
  (t) => [index("idx_workouts_user_kind").on(t.userId, t.kind)],
);

// ── Exercise Profiles ──────────────────────────────────────────────────────

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

// ── User Sets ──────────────────────────────────────────────────────────────

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
  // Order index of this set's exercise within its workout (all sets of the
  // same exercise+profile in a workout share it). Authoritative for exercise
  // display order, so reordering persists independently of createdAt. Sets
  // within a group still order by createdAt.
  position: integer().notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Friendships ────────────────────────────────────────────────────────────

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

// ── User Gyms (before userSettings due to FK) ──────────────────────────────

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

// ── User Settings ──────────────────────────────────────────────────────────

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
  colorScheme: varchar("color_scheme", { length: 10 }).notNull().default("system"),
});

// ── Favourite Exercises ────────────────────────────────────────────────────

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

// ── Exercise Notes (persistent per-user cue) ───────────────────────────────

export const exerciseNotes = pgTable(
  "exercise_notes",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    note: text().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.exerciseId)],
);

// ── Email Verification Tokens ──────────────────────────────────────────────

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

// ── Password Reset Tokens ──────────────────────────────────────────────────

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

// ── Refresh Tokens ─────────────────────────────────────────────────────────

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").notNull().defaultRandom(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_refresh_tokens_token_hash").on(t.tokenHash),
    index("idx_refresh_tokens_family_id").on(t.familyId),
    index("idx_refresh_tokens_user_id").on(t.userId),
  ],
);

// ── User Activity ──────────────────────────────────────────────────────────

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

// ── OAuth 2.1 Authorization Server ─────────────────────────────────────────
//
// Backs the MCP connector at /mcp. These are deliberately separate from the
// first-party `refresh_tokens` table above: MCP access tokens are opaque,
// audience-bound to the MCP resource URL, and scope-limited, so a first-party
// mobile JWT can never be replayed against /mcp (and vice versa).

export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: uuid().primaryKey().defaultRandom(),
    clientId: varchar("client_id", { length: 64 }).notNull().unique(),
    // NULL for public clients (token_endpoint_auth_method = "none"), which is
    // what Claude registers as over Dynamic Client Registration.
    clientSecretHash: varchar("client_secret_hash", { length: 64 }),
    clientName: varchar("client_name", { length: 255 }),
    clientUri: text("client_uri"),
    logoUri: text("logo_uri"),
    redirectUris: jsonb("redirect_uris").$type<string[]>().notNull(),
    grantTypes: jsonb("grant_types").$type<string[]>().notNull(),
    responseTypes: jsonb("response_types").$type<string[]>().notNull(),
    tokenEndpointAuthMethod: varchar("token_endpoint_auth_method", { length: 32 })
      .notNull()
      .default("none"),
    scope: text(),
    softwareId: varchar("software_id", { length: 255 }),
    softwareVersion: varchar("software_version", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_oauth_clients_client_id").on(t.clientId)],
);

export const oauthAuthorizationCodes = pgTable(
  "oauth_authorization_codes",
  {
    id: uuid().primaryKey().defaultRandom(),
    codeHash: varchar("code_hash", { length: 64 }).notNull().unique(),
    clientId: varchar("client_id", { length: 64 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redirectUri: text("redirect_uri").notNull(),
    scope: text().notNull(),
    // PKCE (RFC 7636) — S256 only, per OAuth 2.1.
    codeChallenge: varchar("code_challenge", { length: 128 }).notNull(),
    codeChallengeMethod: varchar("code_challenge_method", { length: 10 }).notNull().default("S256"),
    // RFC 8707 resource indicator — becomes the access token's audience.
    resource: text().notNull(),
    // Set once the code is exchanged. A second exchange attempt is treated as
    // replay and burns every token descended from this code.
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_oauth_codes_code_hash").on(t.codeHash)],
);

export const oauthAccessTokens = pgTable(
  "oauth_access_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    // Shared with the refresh token chain so a detected refresh replay can
    // revoke the access tokens issued alongside it.
    familyId: uuid("family_id").notNull(),
    clientId: varchar("client_id", { length: 64 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text().notNull(),
    audience: text().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_oauth_access_tokens_token_hash").on(t.tokenHash),
    index("idx_oauth_access_tokens_family_id").on(t.familyId),
    index("idx_oauth_access_tokens_user_id").on(t.userId),
  ],
);

export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    familyId: uuid("family_id").notNull(),
    clientId: varchar("client_id", { length: 64 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text().notNull(),
    audience: text().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_oauth_refresh_tokens_token_hash").on(t.tokenHash),
    index("idx_oauth_refresh_tokens_family_id").on(t.familyId),
    index("idx_oauth_refresh_tokens_user_id").on(t.userId),
  ],
);

// Remembers that a user already approved a given client for a given scope set,
// so reconnecting an already-authorized client skips the consent screen (but
// never the login).
export const oauthConsents = pgTable(
  "oauth_consents",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: varchar("client_id", { length: 64 }).notNull(),
    scope: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.clientId)],
);

// ── User Gym Profile Mappings ──────────────────────────────────────────────

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
