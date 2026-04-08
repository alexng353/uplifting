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
  uniqueIndex,
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
  emailVerified: boolean("email_verified").default(false),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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
  exerciseType: exerciseTypeEnum("exercise_type"),
  official: boolean().default(false),
  authorId: uuid("author_id").references(() => users.id),
  description: text(),
  movementPattern: varchar("movement_pattern", { length: 50 }),
  muscleGroup: varchar("muscle_group", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Exercise–Muscle Relations ──────────────────────────────────────────────

export const exerciseMuscleRelations = pgTable("exercise_muscle_relations", {
  id: uuid().primaryKey().defaultRandom(),
  exerciseId: uuid("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  muscleId: uuid("muscle_id")
    .references(() => muscles.id)
    .notNull(),
  isPrimary: boolean("is_primary").notNull(),
});

// ── Workouts ───────────────────────────────────────────────────────────────

export const workouts = pgTable(
  "workouts",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    name: varchar({ length: 255 }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    privacy: varchar({ length: 20 }).default("friends"),
    gymLocation: varchar("gym_location", { length: 255 }),
    kind: varchar({ length: 20 }).default("workout"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("workouts_user_id_kind_idx").on(table.userId, table.kind)],
);

// ── Exercise Profiles ──────────────────────────────────────────────────────

export const exerciseProfiles = pgTable(
  "exercise_profiles",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id")
      .references(() => exercises.id)
      .notNull(),
    name: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("exercise_profiles_user_exercise_name_idx").on(
      table.userId,
      table.exerciseId,
      table.name,
    ),
  ],
);

// ── User Sets ──────────────────────────────────────────────────────────────

export const userSets = pgTable("user_sets", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  exerciseId: uuid("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workoutId: uuid("workout_id")
    .references(() => workouts.id)
    .notNull(),
  profileId: uuid("profile_id").references(() => exerciseProfiles.id),
  reps: integer().notNull(),
  weight: decimal({ precision: 10, scale: 2 }).notNull(),
  weightUnit: varchar("weight_unit", { length: 3 }).default("kg"),
  side: varchar({ length: 1 }),
  bodyweight: decimal({ precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Friendships ────────────────────────────────────────────────────────────

export const friendships = pgTable(
  "friendships",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    friendId: uuid("friend_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    status: varchar({ length: 20 }).default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("friendships_user_friend_idx").on(
      table.userId,
      table.friendId,
    ),
  ],
);

// ── User Gyms (defined before userSettings due to FK) ──────────────────────

export const userGyms = pgTable(
  "user_gyms",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    name: varchar({ length: 255 }),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    createdAt: timestamp("created_at", { withTimezone: true }),
  },
  (table) => [index("user_gyms_user_id_idx").on(table.userId)],
);

// ── User Settings ──────────────────────────────────────────────────────────

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayUnit: varchar("display_unit", { length: 3 }),
  maxWorkoutDurationMinutes: integer("max_workout_duration_minutes").default(
    120,
  ),
  defaultRestTimerSeconds: integer("default_rest_timer_seconds").default(90),
  defaultPrivacy: varchar("default_privacy", { length: 20 }).default(
    "friends",
  ),
  shareGymLocation: boolean("share_gym_location").default(true),
  shareOnlineStatus: boolean("share_online_status").default(true),
  shareWorkoutStatus: boolean("share_workout_status").default(true),
  shareWorkoutHistory: boolean("share_workout_history").default(true),
  currentGymId: uuid("current_gym_id").references(() => userGyms.id, {
    onDelete: "set null",
  }),
});

// ── Favourite Exercises ────────────────────────────────────────────────────

export const favouriteExercises = pgTable(
  "favourite_exercises",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    exerciseId: uuid("exercise_id").references(() => exercises.id),
    createdAt: timestamp("created_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("favourite_exercises_user_exercise_idx").on(
      table.userId,
      table.exerciseId,
    ),
  ],
);

// ── Email Verification Tokens ──────────────────────────────────────────────

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    token: varchar({ length: 6 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }),
  },
  (table) => [
    index("email_verification_tokens_user_id_idx").on(table.userId),
    index("email_verification_tokens_token_idx").on(table.token),
  ],
);

// ── Password Reset Tokens ──────────────────────────────────────────────────

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    token: varchar({ length: 6 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }),
  },
  (table) => [
    index("password_reset_tokens_user_id_idx").on(table.userId),
    index("password_reset_tokens_token_idx").on(table.token),
  ],
);

// ── User Activity ──────────────────────────────────────────────────────────

export const userActivity = pgTable(
  "user_activity",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
    currentWorkoutId: uuid("current_workout_id").references(
      () => workouts.id,
      { onDelete: "set null" },
    ),
    currentWorkoutStartedAt: timestamp("current_workout_started_at", {
      withTimezone: true,
    }),
  },
  (table) => [index("user_activity_last_seen_at_idx").on(table.lastSeenAt)],
);

// ── User Gym Profile Mappings ──────────────────────────────────────────────

export const userGymProfileMappings = pgTable(
  "user_gym_profile_mappings",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    gymId: uuid("gym_id").references(() => userGyms.id, {
      onDelete: "cascade",
    }),
    exerciseId: uuid("exercise_id").references(() => exercises.id, {
      onDelete: "cascade",
    }),
    profileId: uuid("profile_id").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("user_gym_profile_mappings_user_gym_exercise_idx").on(
      table.userId,
      table.gymId,
      table.exerciseId,
    ),
    index("user_gym_profile_mappings_user_gym_idx").on(
      table.userId,
      table.gymId,
    ),
  ],
);
