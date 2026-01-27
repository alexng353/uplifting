-- Add more official exercises
BEGIN;

-- Insert additional official exercises
INSERT INTO exercises (name, exercise_type, official, description, movement_pattern, muscle_group)
VALUES
    ('Chest-Supported T-Bar Row', 'plate_loaded_machine', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Plate Loaded Shoulder Press', 'plate_loaded_machine', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Plate Loaded Flat Press', 'plate_loaded_machine', true, 'Targets: pectoralis major', 'horizontal_push', 'chest'),
    ('Plate Loaded Incline Press', 'plate_loaded_machine', true, 'Targets: pectoralis major, anterior deltoid', 'horizontal_push', 'chest'),
    ('Plate Loaded Decline Press', 'plate_loaded_machine', true, 'Targets: pectoralis major', 'horizontal_push', 'chest'),
    ('Seated Cable Lat Pulldown', 'cable', true, 'Targets: latissimus dorsi, teres major', 'vertical_pull', 'back'),
    ('Assisted Pull-Up', 'machine', true, 'Targets: latissimus dorsi, teres major', 'vertical_pull', 'back'),
    ('Assisted Dips', 'machine', true, 'Targets: pectoralis major, pectoralis minor, triceps brachii, lateral head', 'vertical_push', 'chest')
ON CONFLICT DO NOTHING;

-- Primary muscles
INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported T-Bar Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported T-Bar Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported T-Bar Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported T-Bar Row' AND m.name = 'rhomboid minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Shoulder Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Shoulder Press' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Flat Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Incline Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Incline Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Decline Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Lat Pulldown' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Lat Pulldown' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Assisted Pull-Up' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Assisted Pull-Up' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Assisted Dips' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Assisted Dips' AND m.name = 'pectoralis minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Assisted Dips' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Assisted Dips' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

-- Secondary muscles
INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported T-Bar Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported T-Bar Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported T-Bar Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Shoulder Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Shoulder Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Flat Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Flat Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Flat Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Incline Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Incline Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Decline Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Decline Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Loaded Decline Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Lat Pulldown' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Lat Pulldown' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Lat Pulldown' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Lat Pulldown' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Assisted Pull-Up' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Assisted Pull-Up' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Assisted Pull-Up' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Assisted Pull-Up' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Assisted Pull-Up' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Assisted Dips' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Assisted Dips' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

COMMIT;
