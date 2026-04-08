CREATE TYPE "public"."exercise_type" AS ENUM('dumbbell', 'barbell', 'bodyweight', 'machine', 'kettlebell', 'resistance_band', 'cable', 'medicine_ball', 'plyometric', 'plate_loaded_machine');--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(6) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_muscle_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"muscle_id" uuid NOT NULL,
	"is_primary" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_profiles_user_id_exercise_id_name_unique" UNIQUE("user_id","exercise_id","name")
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"exercise_type" "exercise_type" NOT NULL,
	"official" boolean DEFAULT false NOT NULL,
	"author_id" uuid,
	"description" text,
	"movement_pattern" varchar(50),
	"muscle_group" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favourite_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favourite_exercises_user_id_exercise_id_unique" UNIQUE("user_id","exercise_id")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"friend_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_user_id_friend_id_unique" UNIQUE("user_id","friend_id")
);
--> statement-breakpoint
CREATE TABLE "muscles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"scientific_name" varchar(255),
	"major_group" varchar(255),
	"minor_group" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(6) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"current_workout_id" uuid,
	"current_workout_started_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_gym_profile_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gym_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_gym_profile_mappings_user_id_gym_id_exercise_id_unique" UNIQUE("user_id","gym_id","exercise_id")
);
--> statement-breakpoint
CREATE TABLE "user_gyms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"workout_id" uuid NOT NULL,
	"profile_id" uuid,
	"reps" integer NOT NULL,
	"weight" numeric(10, 2) NOT NULL,
	"weight_unit" varchar(3) DEFAULT 'kg' NOT NULL,
	"side" varchar(1),
	"bodyweight" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_unit" varchar(3),
	"max_workout_duration_minutes" integer DEFAULT 120 NOT NULL,
	"default_rest_timer_seconds" integer DEFAULT 90 NOT NULL,
	"default_privacy" varchar(20) DEFAULT 'friends' NOT NULL,
	"share_gym_location" boolean DEFAULT true NOT NULL,
	"share_online_status" boolean DEFAULT true NOT NULL,
	"share_workout_status" boolean DEFAULT true NOT NULL,
	"share_workout_history" boolean DEFAULT true NOT NULL,
	"current_gym_id" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"real_name" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"avatar_url" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255),
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"privacy" varchar(20) DEFAULT 'friends' NOT NULL,
	"gym_location" varchar(255),
	"kind" varchar(20) DEFAULT 'workout' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_muscle_relations" ADD CONSTRAINT "exercise_muscle_relations_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_muscle_relations" ADD CONSTRAINT "exercise_muscle_relations_muscle_id_muscles_id_fk" FOREIGN KEY ("muscle_id") REFERENCES "public"."muscles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_profiles" ADD CONSTRAINT "exercise_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_profiles" ADD CONSTRAINT "exercise_profiles_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourite_exercises" ADD CONSTRAINT "favourite_exercises_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourite_exercises" ADD CONSTRAINT "favourite_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_users_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_current_workout_id_workouts_id_fk" FOREIGN KEY ("current_workout_id") REFERENCES "public"."workouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gym_profile_mappings" ADD CONSTRAINT "user_gym_profile_mappings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gym_profile_mappings" ADD CONSTRAINT "user_gym_profile_mappings_gym_id_user_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."user_gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gym_profile_mappings" ADD CONSTRAINT "user_gym_profile_mappings_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gyms" ADD CONSTRAINT "user_gyms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sets" ADD CONSTRAINT "user_sets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sets" ADD CONSTRAINT "user_sets_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sets" ADD CONSTRAINT "user_sets_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sets" ADD CONSTRAINT "user_sets_profile_id_exercise_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."exercise_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_current_gym_id_user_gyms_id_fk" FOREIGN KEY ("current_gym_id") REFERENCES "public"."user_gyms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_email_verification_tokens_user_id" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_email_verification_tokens_token" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_user_activity_last_seen" ON "user_activity" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "idx_gym_profile_mappings_user_gym" ON "user_gym_profile_mappings" USING btree ("user_id","gym_id");--> statement-breakpoint
CREATE INDEX "idx_user_gyms_user_id" ON "user_gyms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workouts_user_kind" ON "workouts" USING btree ("user_id","kind");