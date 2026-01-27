-- Add standing leg press variants
BEGIN;

-- Insert additional official exercises
INSERT INTO exercises (name, exercise_type, official, description, movement_pattern, muscle_group)
VALUES
    ('Standing Leg Press', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Plate Loaded Standing Leg Press', 'plate_loaded_machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps')
ON CONFLICT DO NOTHING;

-- Primary muscles
INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Standing Leg Press' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Standing Leg Press' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Standing Leg Press' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Standing Leg Press' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Press' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Press' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Press' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Press' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

-- Secondary muscles
INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Standing Leg Press' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Standing Leg Press' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Press' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Standing Leg Press' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

COMMIT;
