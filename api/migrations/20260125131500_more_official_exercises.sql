-- Add more official exercises
BEGIN;

-- Insert additional official exercises
INSERT INTO exercises (name, exercise_type, official, description, movement_pattern, muscle_group)
VALUES
    ('Floor Press', 'barbell', true, 'Targets: pectoralis major', 'horizontal_push', 'chest'),
    ('Svend Press', 'dumbbell', true, 'Targets: pectoralis major', 'isolation', 'chest'),
    ('Cable Chest Press', 'cable', true, 'Targets: pectoralis major', 'horizontal_push', 'chest'),
    ('Snatch-Grip Deadlift', 'barbell', true, 'Targets: erector spinae, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Block Pull', 'barbell', true, 'Targets: erector spinae, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Rack Pull', 'barbell', true, 'Targets: erector spinae, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Chest-Supported Dumbbell Row', 'dumbbell', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Kayak Row', 'cable', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Machine Lat Pulldown', 'machine', true, 'Targets: latissimus dorsi, teres major', 'vertical_pull', 'back'),
    ('Behind-the-Neck Lat Pulldown', 'cable', true, 'Targets: latissimus dorsi, teres major', 'vertical_pull', 'back'),
    ('Behind-the-Neck Pull-Up', 'bodyweight', true, 'Targets: latissimus dorsi, teres major', 'vertical_pull', 'back'),
    ('Behind-the-Neck Press', 'barbell', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Z Press', 'barbell', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Viking Press', 'plate_loaded_machine', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Lu Raises', 'dumbbell', true, 'Targets: lateral deltoid', 'isolation', 'shoulders'),
    ('Prone Y Raise', 'dumbbell', true, 'Targets: trapezius, lower, posterior deltoid', 'isolation', 'back'),
    ('Prone T Raise', 'dumbbell', true, 'Targets: trapezius, middle, posterior deltoid', 'isolation', 'back'),
    ('Cable Upright Row', 'cable', true, 'Targets: lateral deltoid, trapezius, upper', 'vertical_pull', 'shoulders'),
    ('JM Press', 'barbell', true, 'Targets: triceps brachii, lateral head, triceps brachii, medial head', 'horizontal_push', 'triceps'),
    ('Tate Press', 'dumbbell', true, 'Targets: triceps brachii, long head', 'isolation', 'triceps'),
    ('French Press', 'barbell', true, 'Targets: triceps brachii, long head', 'isolation', 'triceps'),
    ('Tricep Dip Machine', 'machine', true, 'Targets: triceps brachii, lateral head, triceps brachii, medial head', 'vertical_push', 'triceps'),
    ('Drag Curl', 'barbell', true, 'Targets: biceps brachii, long head', 'isolation', 'biceps'),
    ('Bayesian Curl', 'cable', true, 'Targets: biceps brachii, long head', 'isolation', 'biceps'),
    ('Machine Preacher Curl', 'machine', true, 'Targets: biceps brachii, short head', 'isolation', 'biceps'),
    ('EZ Preacher Curl', 'barbell', true, 'Targets: biceps brachii, short head', 'isolation', 'biceps'),
    ('Scott Curl', 'barbell', true, 'Targets: biceps brachii, short head', 'isolation', 'biceps'),
    ('Cyclist Squat', 'barbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Heel Elevated Squat', 'barbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Anderson Squat', 'barbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Landmine Squat', 'barbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Spanish Squat', 'resistance_band', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Reverse Hack Squat', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('V-Squat', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Leg Press Feet High', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Leg Press Feet Low', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Sliding Leg Curl', 'bodyweight', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, biceps femoris short head, hamstrings, semitendinosus', 'isolation', 'hamstrings'),
    ('Stability Ball Leg Curl', 'bodyweight', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, biceps femoris short head, hamstrings, semitendinosus', 'isolation', 'hamstrings'),
    ('Banded Leg Curl', 'resistance_band', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, biceps femoris short head, hamstrings, semitendinosus', 'isolation', 'hamstrings'),
    ('45-Degree Hip Extension', 'machine', true, 'Targets: gluteus maximus, erector spinae', 'hip_hinge', 'glutes'),
    ('Reverse Lunge Smith Machine', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, gluteus maximus', 'lunge', 'quadriceps'),
    ('Smith Machine Calf Raise', 'machine', true, 'Targets: gastrocnemius, medial head, gastrocnemius, lateral head', 'isolation', 'calves'),
    ('Landmine Rotation', 'barbell', true, 'Targets: external oblique, internal oblique', 'rotation', 'core'),
    ('Cable Oblique Crunch', 'cable', true, 'Targets: external oblique, internal oblique', 'isolation', 'core'),
    ('Weighted Plank', 'bodyweight', true, 'Targets: rectus abdominis, transverse abdominis', 'isolation', 'core'),
    ('Reverse Crunch', 'bodyweight', true, 'Targets: rectus abdominis, iliopsoas', 'isolation', 'core'),
    ('Toe Touch', 'bodyweight', true, 'Targets: rectus abdominis', 'isolation', 'core'),
    ('Mountain Climber', 'bodyweight', true, 'Targets: rectus abdominis, transverse abdominis', 'isolation', 'core'),
    ('Dragon Flag', 'bodyweight', true, 'Targets: rectus abdominis, transverse abdominis', 'isolation', 'core'),
    ('L-Sit', 'bodyweight', true, 'Targets: rectus abdominis, iliopsoas', 'isolation', 'core'),
    ('Toes to Bar', 'bodyweight', true, 'Targets: rectus abdominis, iliopsoas', 'isolation', 'core'),
    ('Knee Raise', 'bodyweight', true, 'Targets: rectus abdominis, iliopsoas', 'isolation', 'core'),
    ('Suitcase Deadlift', 'barbell', true, 'Targets: erector spinae, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'core'),
    ('High Pull', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Hang Snatch', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Power Snatch', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Clean Pull', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Snatch Pull', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Push Jerk', 'barbell', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Split Jerk', 'barbell', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Squat Clean', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, quadriceps, rectus femoris', 'hip_hinge', 'back'),
    ('Squat Snatch', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Prone External Rotation', 'dumbbell', true, 'Targets: infraspinatus, teres minor', 'isolation', 'rotator_cuff'),
    ('Side-Lying External Rotation', 'dumbbell', true, 'Targets: infraspinatus, teres minor', 'isolation', 'rotator_cuff'),
    ('YTWL Raises', 'dumbbell', true, 'Targets: trapezius, lower, trapezius, middle, posterior deltoid', 'isolation', 'back'),
    ('Scaption', 'dumbbell', true, 'Targets: supraspinatus, anterior deltoid', 'isolation', 'rotator_cuff'),
    ('Plate Pinch', 'dumbbell', true, 'Targets: flexor carpi radialis, flexor carpi ulnaris', 'isolation', 'forearms'),
    ('Finger Curl', 'barbell', true, 'Targets: flexor carpi radialis, flexor carpi ulnaris', 'isolation', 'forearms'),
    ('Behind-the-Back Wrist Curl', 'barbell', true, 'Targets: flexor carpi radialis, flexor carpi ulnaris', 'isolation', 'forearms')
ON CONFLICT DO NOTHING;

-- Primary muscles
INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Floor Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Svend Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Chest Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Dumbbell Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Dumbbell Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Dumbbell Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Kayak Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Kayak Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Kayak Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Lat Pulldown' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Lat Pulldown' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Lat Pulldown' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Lat Pulldown' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Pull-Up' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Pull-Up' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Press' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Z Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Z Press' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Viking Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Viking Press' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Lu Raises' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Prone Y Raise' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Prone Y Raise' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Prone T Raise' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Prone T Raise' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Upright Row' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Upright Row' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'JM Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'JM Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Tate Press' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'French Press' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Tricep Dip Machine' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Tricep Dip Machine' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Tricep Dip Machine' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Drag Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Bayesian Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Preacher Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'EZ Preacher Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Scott Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cyclist Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cyclist Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cyclist Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cyclist Squat' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cyclist Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Heel Elevated Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Heel Elevated Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Heel Elevated Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Heel Elevated Squat' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Heel Elevated Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Anderson Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Anderson Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Anderson Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Anderson Squat' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Anderson Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Landmine Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Landmine Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Landmine Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Landmine Squat' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Landmine Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Spanish Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Spanish Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Spanish Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Spanish Squat' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Spanish Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Hack Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Hack Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Hack Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Hack Squat' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'V-Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'V-Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'V-Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'V-Squat' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet High' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet High' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet High' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet High' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet Low' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet Low' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet Low' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet Low' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sliding Leg Curl' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sliding Leg Curl' AND m.name = 'hamstrings, biceps femoris short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sliding Leg Curl' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sliding Leg Curl' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Stability Ball Leg Curl' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Stability Ball Leg Curl' AND m.name = 'hamstrings, biceps femoris short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Stability Ball Leg Curl' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Stability Ball Leg Curl' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Banded Leg Curl' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Banded Leg Curl' AND m.name = 'hamstrings, biceps femoris short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Banded Leg Curl' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Banded Leg Curl' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = '45-Degree Hip Extension' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Lunge Smith Machine' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Lunge Smith Machine' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Lunge Smith Machine' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Smith Machine Calf Raise' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Smith Machine Calf Raise' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Landmine Rotation' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Landmine Rotation' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Oblique Crunch' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Oblique Crunch' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Weighted Plank' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Weighted Plank' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Crunch' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Crunch' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Toe Touch' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Mountain Climber' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Mountain Climber' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dragon Flag' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dragon Flag' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'L-Sit' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'L-Sit' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Toes to Bar' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Toes to Bar' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Knee Raise' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Knee Raise' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'High Pull' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'High Pull' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'High Pull' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'High Pull' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hang Snatch' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hang Snatch' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hang Snatch' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hang Snatch' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Power Snatch' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Power Snatch' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Power Snatch' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Power Snatch' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Clean Pull' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Clean Pull' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Clean Pull' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Clean Pull' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch Pull' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch Pull' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch Pull' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch Pull' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Push Jerk' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Push Jerk' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Split Jerk' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Split Jerk' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Squat Clean' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Squat Clean' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Squat Clean' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Squat Snatch' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Squat Snatch' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Squat Snatch' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Squat Snatch' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Prone External Rotation' AND m.name = 'infraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Prone External Rotation' AND m.name = 'teres minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Side-Lying External Rotation' AND m.name = 'infraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Side-Lying External Rotation' AND m.name = 'teres minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'YTWL Raises' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'YTWL Raises' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'YTWL Raises' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Scaption' AND m.name = 'supraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Pinch' AND m.name = 'flexor carpi radialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Pinch' AND m.name = 'flexor carpi ulnaris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Finger Curl' AND m.name = 'flexor carpi radialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Finger Curl' AND m.name = 'flexor carpi ulnaris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Back Wrist Curl' AND m.name = 'flexor carpi radialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Back Wrist Curl' AND m.name = 'flexor carpi ulnaris'
ON CONFLICT DO NOTHING;

-- Secondary muscles
INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Floor Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Floor Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Floor Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Svend Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Chest Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Chest Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Chest Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch-Grip Deadlift' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Block Pull' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rack Pull' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Dumbbell Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Dumbbell Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Dumbbell Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Kayak Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Kayak Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Kayak Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Kayak Row' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Lat Pulldown' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Lat Pulldown' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Lat Pulldown' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Lat Pulldown' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Lat Pulldown' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Lat Pulldown' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Lat Pulldown' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Lat Pulldown' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Pull-Up' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Pull-Up' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Pull-Up' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Pull-Up' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Pull-Up' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Press' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Neck Press' AND m.name = 'serratus anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Z Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Z Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Z Press' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Z Press' AND m.name = 'serratus anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Viking Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Viking Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Viking Press' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Viking Press' AND m.name = 'serratus anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Lu Raises' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Prone Y Raise' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Prone Y Raise' AND m.name = 'infraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Prone T Raise' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Prone T Raise' AND m.name = 'infraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Upright Row' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Upright Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Upright Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'JM Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'JM Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'JM Press' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Tate Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Tate Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'French Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'French Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Tricep Dip Machine' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Tricep Dip Machine' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Drag Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Drag Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Drag Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Bayesian Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Bayesian Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Preacher Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Preacher Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'EZ Preacher Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'EZ Preacher Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Scott Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Scott Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cyclist Squat' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cyclist Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cyclist Squat' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Heel Elevated Squat' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Heel Elevated Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Heel Elevated Squat' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Anderson Squat' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Anderson Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Anderson Squat' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Landmine Squat' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Landmine Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Landmine Squat' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Spanish Squat' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Spanish Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Spanish Squat' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Hack Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'V-Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet High' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet High' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet Low' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Feet Low' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Sliding Leg Curl' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Sliding Leg Curl' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Stability Ball Leg Curl' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Stability Ball Leg Curl' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Banded Leg Curl' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Banded Leg Curl' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = '45-Degree Hip Extension' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = '45-Degree Hip Extension' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Lunge Smith Machine' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Lunge Smith Machine' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Smith Machine Calf Raise' AND m.name = 'soleus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Landmine Rotation' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Landmine Rotation' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Landmine Rotation' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Oblique Crunch' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Weighted Plank' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Weighted Plank' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Weighted Plank' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Crunch' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Crunch' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Toe Touch' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Toe Touch' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Mountain Climber' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Mountain Climber' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Mountain Climber' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dragon Flag' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dragon Flag' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dragon Flag' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'L-Sit' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'L-Sit' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'L-Sit' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Toes to Bar' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Toes to Bar' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Knee Raise' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Knee Raise' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Deadlift' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'High Pull' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'High Pull' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'High Pull' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hang Snatch' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hang Snatch' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hang Snatch' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hang Snatch' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Power Snatch' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Power Snatch' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Power Snatch' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Power Snatch' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Clean Pull' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Clean Pull' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Clean Pull' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch Pull' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch Pull' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch Pull' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch Pull' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push Jerk' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push Jerk' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push Jerk' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push Jerk' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Split Jerk' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Split Jerk' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Split Jerk' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Split Jerk' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Squat Clean' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Squat Clean' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Squat Clean' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Squat Snatch' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Squat Snatch' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Squat Snatch' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Squat Snatch' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Prone External Rotation' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Side-Lying External Rotation' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'YTWL Raises' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'YTWL Raises' AND m.name = 'infraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Scaption' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Pinch' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Finger Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Behind-the-Back Wrist Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

COMMIT;
