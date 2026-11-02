CREATE TABLE "gym_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_workout_id" varchar(64) NOT NULL,
	"kind" varchar(10) NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"accuracy_m" double precision,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gym_checkins_user_id_client_workout_id_kind_unique" UNIQUE("user_id","client_workout_id","kind")
);
--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "client_id" varchar(64);--> statement-breakpoint
ALTER TABLE "gym_checkins" ADD CONSTRAINT "gym_checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gym_checkins_user_at" ON "gym_checkins" USING btree ("user_id","at");