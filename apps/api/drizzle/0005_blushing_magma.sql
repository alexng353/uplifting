CREATE TABLE "exercise_agent_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	CONSTRAINT "exercise_agent_notification_revision" UNIQUE("session_id","revision")
);
--> statement-breakpoint
CREATE TABLE "exercise_agent_push_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_agent_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'queued' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"draft" jsonb,
	"error" text,
	"exercise_id" uuid,
	"lease_token" uuid,
	"lease_until" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_agent_notifications" ADD CONSTRAINT "exercise_agent_notifications_session_id_exercise_agent_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exercise_agent_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_agent_push_tokens" ADD CONSTRAINT "exercise_agent_push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_agent_sessions" ADD CONSTRAINT "exercise_agent_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_agent_sessions" ADD CONSTRAINT "exercise_agent_sessions_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_agent_owner_idx" ON "exercise_agent_sessions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "exercise_agent_queue_idx" ON "exercise_agent_sessions" USING btree ("status","available_at");