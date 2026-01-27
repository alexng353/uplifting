-- Add weight tracking to sets
ALTER TABLE user_sets ADD COLUMN weight DECIMAL NOT NULL;
ALTER TABLE user_sets ADD COLUMN weight_unit VARCHAR(3) NOT NULL DEFAULT 'kg';
ALTER TABLE user_sets ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Exercise profiles
CREATE TABLE exercise_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, exercise_id, name)
);
ALTER TABLE user_sets ADD COLUMN profile_id UUID REFERENCES exercise_profiles(id);

-- Workout metadata
ALTER TABLE workouts ADD COLUMN name VARCHAR(255);
ALTER TABLE workouts ADD COLUMN privacy VARCHAR(20) NOT NULL DEFAULT 'friends';
ALTER TABLE workouts ADD COLUMN gym_location VARCHAR(255);
ALTER TABLE workouts ALTER COLUMN end_time DROP NOT NULL;

-- Friendships
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- User settings
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_unit VARCHAR(3),
    max_workout_duration_minutes INTEGER NOT NULL DEFAULT 120,
    default_rest_timer_seconds INTEGER NOT NULL DEFAULT 90,
    default_privacy VARCHAR(20) NOT NULL DEFAULT 'friends',
    share_gym_location BOOLEAN NOT NULL DEFAULT true
);

-- Favourite exercises
CREATE TABLE favourite_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, exercise_id)
);

-- User avatars
ALTER TABLE users ADD COLUMN avatar_url TEXT;
