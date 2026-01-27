-- Add migration script here

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    real_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE muscles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE body_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE muscle_bodypart_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    muscle_id UUID NOT NULL REFERENCES muscles(id),
    body_part_id UUID NOT NULL REFERENCES body_parts(id)
);

CREATE TYPE exercise_type AS ENUM (
    'dumbbell',
    'barbell',
    'bodyweight',
    'machine',
    'kettlebell',
    'resistance_band',
    'cable',
    'medicine_ball',
    'plyometric',
    'plate_loaded_machine'
);

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    exercise_type exercise_type NOT NULL
);

CREATE TABLE exercise_muscle_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    muscle_id UUID NOT NULL REFERENCES muscles(id),
    is_primary BOOLEAN NOT NULL
);

CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL
);

CREATE TABLE user_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    workout_id UUID NOT NULL REFERENCES workouts(id),
    reps INTEGER NOT NULL CHECK (reps > 0)
);

