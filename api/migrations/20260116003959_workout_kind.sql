-- Add workout kind to distinguish between regular workouts and rest days
-- Using a simple varchar instead of enum for flexibility

ALTER TABLE workouts ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'workout';

-- Create index for efficient filtering by kind
CREATE INDEX idx_workouts_user_kind ON workouts(user_id, kind);
