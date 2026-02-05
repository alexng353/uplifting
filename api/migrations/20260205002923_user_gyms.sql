-- User gyms table
CREATE TABLE user_gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_gyms_user_id ON user_gyms(user_id);

-- Current gym selection (stored in user_settings)
ALTER TABLE user_settings ADD COLUMN current_gym_id UUID REFERENCES user_gyms(id) ON DELETE SET NULL;

-- Gym profile mappings - stores which profile was last used for each exercise at each gym
CREATE TABLE user_gym_profile_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES user_gyms(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, gym_id, exercise_id)
);

CREATE INDEX idx_gym_profile_mappings_user_gym ON user_gym_profile_mappings(user_id, gym_id);
