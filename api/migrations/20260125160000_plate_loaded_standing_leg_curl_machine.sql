-- Add plate loaded standing leg curl machine
BEGIN;

-- Insert additional official exercises
INSERT INTO exercises (name, exercise_type, official, description, movement_pattern, muscle_group)
VALUES
    ('Plate Loaded Standing Leg Curl Machine', 'plate_loaded_machine', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, biceps femoris short head, hamstrings, semitendinosus', 'isolation', 'hamstrings')
ON CONFLICT DO NOTHING;

-- Primary muscles
INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Curl Machine' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Curl Machine' AND m.name = 'hamstrings, biceps femoris short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Curl Machine' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Curl Machine' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

-- Secondary muscles
INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Curl Machine' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Curl Machine' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

COMMIT;
