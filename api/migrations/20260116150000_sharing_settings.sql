-- Add sharing/privacy settings to user_settings
ALTER TABLE user_settings ADD COLUMN share_online_status BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN share_workout_status BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_settings ADD COLUMN share_workout_history BOOLEAN NOT NULL DEFAULT true;

-- Track user activity for online status and current workout
CREATE TABLE user_activity (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    current_workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
    current_workout_started_at TIMESTAMP
);

-- Index for finding active users
CREATE INDEX idx_user_activity_last_seen ON user_activity(last_seen_at);
