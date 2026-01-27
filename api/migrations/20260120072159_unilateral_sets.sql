-- Add side column for unilateral sets (L/R tracking)
ALTER TABLE user_sets ADD COLUMN side VARCHAR(1) CHECK (side IN ('L', 'R'));
