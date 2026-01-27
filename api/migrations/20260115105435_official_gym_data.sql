-- Generated migration for official exercises and muscles
-- Generated at: 2026-01-15T10:54:35.861Z

BEGIN;

-- Add movement pattern to exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS movement_pattern VARCHAR(50);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS muscle_group VARCHAR(50);

-- Insert official gym muscles
INSERT INTO muscles (name, scientific_name, major_group, minor_group)
VALUES
    ('pectoralis major', 'pectoralis major', 'upper_body_push', 'chest'),
    ('pectoralis minor', 'pectoralis minor', 'upper_body_push', 'chest'),
    ('anterior deltoid', 'anterior deltoid', 'upper_body_push', 'front delt'),
    ('lateral deltoid', 'lateral deltoid', 'upper_body_push', 'side delt'),
    ('posterior deltoid', 'posterior deltoid', 'upper_body_pull', 'rear delt'),
    ('triceps brachii, long head', 'triceps brachii, long head', 'upper_body_push', 'triceps'),
    ('triceps brachii, lateral head', 'triceps brachii, lateral head', 'upper_body_push', 'triceps'),
    ('triceps brachii, medial head', 'triceps brachii, medial head', 'upper_body_push', 'triceps'),
    ('latissimus dorsi', 'latissimus dorsi', 'upper_body_pull', 'lats'),
    ('trapezius, upper', 'trapezius, upper', 'upper_body_pull', 'upper traps'),
    ('trapezius, middle', 'trapezius, middle', 'upper_body_pull', 'mid traps'),
    ('trapezius, lower', 'trapezius, lower', 'upper_body_pull', 'lower traps'),
    ('rhomboid major', 'rhomboid major', 'upper_body_pull', 'rhomboids'),
    ('rhomboid minor', 'rhomboid minor', 'upper_body_pull', 'rhomboids'),
    ('erector spinae', 'erector spinae', 'upper_body_pull', 'spinal erectors'),
    ('biceps brachii, long head', 'biceps brachii, long head', 'upper_body_pull', 'biceps'),
    ('biceps brachii, short head', 'biceps brachii, short head', 'upper_body_pull', 'biceps'),
    ('brachialis', 'brachialis', 'upper_body_pull', 'brachialis'),
    ('brachioradialis', 'brachioradialis', 'upper_body_pull', 'forearm'),
    ('flexor carpi radialis', 'flexor carpi radialis', 'upper_body_pull', 'forearm flexors'),
    ('flexor carpi ulnaris', 'flexor carpi ulnaris', 'upper_body_pull', 'forearm flexors'),
    ('extensor carpi radialis', 'extensor carpi radialis', 'upper_body_pull', 'forearm extensors'),
    ('extensor carpi ulnaris', 'extensor carpi ulnaris', 'upper_body_pull', 'forearm extensors'),
    ('rectus abdominis', 'rectus abdominis', 'core', 'abs'),
    ('external oblique', 'external oblique', 'core', 'obliques'),
    ('internal oblique', 'internal oblique', 'core', 'obliques'),
    ('transverse abdominis', 'transverse abdominis', 'core', 'TVA'),
    ('quadriceps, rectus femoris', 'quadriceps, rectus femoris', 'lower_body', 'quads'),
    ('quadriceps, vastus lateralis', 'quadriceps, vastus lateralis', 'lower_body', 'quads'),
    ('quadriceps, vastus medialis', 'quadriceps, vastus medialis', 'lower_body', 'quads'),
    ('quadriceps, vastus intermedius', 'quadriceps, vastus intermedius', 'lower_body', 'quads'),
    ('hamstrings, biceps femoris long head', 'hamstrings, biceps femoris long head', 'lower_body', 'hamstrings'),
    ('hamstrings, biceps femoris short head', 'hamstrings, biceps femoris short head', 'lower_body', 'hamstrings'),
    ('hamstrings, semitendinosus', 'hamstrings, semitendinosus', 'lower_body', 'hamstrings'),
    ('hamstrings, semimembranosus', 'hamstrings, semimembranosus', 'lower_body', 'hamstrings'),
    ('gluteus maximus', 'gluteus maximus', 'lower_body', 'glutes'),
    ('gluteus medius', 'gluteus medius', 'lower_body', 'glutes'),
    ('gluteus minimus', 'gluteus minimus', 'lower_body', 'glutes'),
    ('gastrocnemius, medial head', 'gastrocnemius, medial head', 'lower_body', 'calves'),
    ('gastrocnemius, lateral head', 'gastrocnemius, lateral head', 'lower_body', 'calves'),
    ('soleus', 'soleus', 'lower_body', 'calves'),
    ('adductor magnus', 'adductor magnus', 'lower_body', 'adductors'),
    ('adductor longus', 'adductor longus', 'lower_body', 'adductors'),
    ('adductor brevis', 'adductor brevis', 'lower_body', 'adductors'),
    ('gracilis', 'gracilis', 'lower_body', 'adductors'),
    ('tensor fasciae latae', 'tensor fasciae latae', 'lower_body', 'TFL'),
    ('iliopsoas', 'iliopsoas', 'lower_body', 'hip flexors'),
    ('serratus anterior', 'serratus anterior', 'scapular', 'serratus'),
    ('levator scapulae', 'levator scapulae', 'scapular', 'levator scap'),
    ('supraspinatus', 'supraspinatus', 'rotator_cuff', 'rotator cuff'),
    ('infraspinatus', 'infraspinatus', 'rotator_cuff', 'rotator cuff'),
    ('teres minor', 'teres minor', 'rotator_cuff', 'rotator cuff'),
    ('subscapularis', 'subscapularis', 'rotator_cuff', 'rotator cuff'),
    ('teres major', 'teres major', 'upper_body_pull', 'teres major'),
    ('coracobrachialis', 'coracobrachialis', 'upper_body_pull', 'coracobrachialis'),
    ('tibialis anterior', 'tibialis anterior', 'lower_body', 'tibialis'),
    ('piriformis', 'piriformis', 'lower_body', 'piriformis'),
    ('sternocleidomastoid', 'sternocleidomastoid', 'neck', 'SCM'),
    ('splenius capitis', 'splenius capitis', 'neck', 'neck extensors'),
    ('semispinalis capitis', 'semispinalis capitis', 'neck', 'neck extensors')
ON CONFLICT DO NOTHING;

-- Insert official exercises
INSERT INTO exercises (name, exercise_type, official, description, movement_pattern, muscle_group)
VALUES
    ('Barbell Bench Press', 'barbell', true, 'Targets: pectoralis major', 'horizontal_push', 'chest'),
    ('Incline Barbell Bench Press', 'barbell', true, 'Targets: pectoralis major, anterior deltoid', 'horizontal_push', 'chest'),
    ('Decline Barbell Bench Press', 'barbell', true, 'Targets: pectoralis major', 'horizontal_push', 'chest'),
    ('Dumbbell Bench Press', 'dumbbell', true, 'Targets: pectoralis major', 'horizontal_push', 'chest'),
    ('Incline Dumbbell Bench Press', 'dumbbell', true, 'Targets: pectoralis major, anterior deltoid', 'horizontal_push', 'chest'),
    ('Dumbbell Flyes', 'dumbbell', true, 'Targets: pectoralis major', 'isolation', 'chest'),
    ('Incline Dumbbell Flyes', 'dumbbell', true, 'Targets: pectoralis major', 'isolation', 'chest'),
    ('Cable Crossover', 'cable', true, 'Targets: pectoralis major', 'isolation', 'chest'),
    ('Low Cable Crossover', 'cable', true, 'Targets: pectoralis major', 'isolation', 'chest'),
    ('Machine Chest Press', 'machine', true, 'Targets: pectoralis major', 'horizontal_push', 'chest'),
    ('Pec Deck', 'machine', true, 'Targets: pectoralis major', 'isolation', 'chest'),
    ('Push-Up', 'bodyweight', true, 'Targets: pectoralis major', 'horizontal_push', 'chest'),
    ('Diamond Push-Up', 'bodyweight', true, 'Targets: triceps brachii, lateral head, triceps brachii, medial head, triceps brachii, long head', 'horizontal_push', 'chest'),
    ('Dips', 'bodyweight', true, 'Targets: pectoralis major, pectoralis minor, triceps brachii, lateral head', 'vertical_push', 'chest'),
    ('Close-Grip Bench Press', 'barbell', true, 'Targets: triceps brachii, lateral head, triceps brachii, medial head', 'horizontal_push', 'triceps'),
    ('Overhead Press', 'barbell', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Seated Dumbbell Shoulder Press', 'dumbbell', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Arnold Press', 'dumbbell', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Machine Shoulder Press', 'machine', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Push Press', 'barbell', true, 'Targets: anterior deltoid, lateral deltoid', 'vertical_push', 'shoulders'),
    ('Landmine Press', 'barbell', true, 'Targets: anterior deltoid, pectoralis major', 'vertical_push', 'shoulders'),
    ('Lateral Raise', 'dumbbell', true, 'Targets: lateral deltoid', 'isolation', 'shoulders'),
    ('Cable Lateral Raise', 'cable', true, 'Targets: lateral deltoid', 'isolation', 'shoulders'),
    ('Machine Lateral Raise', 'machine', true, 'Targets: lateral deltoid', 'isolation', 'shoulders'),
    ('Front Raise', 'dumbbell', true, 'Targets: anterior deltoid', 'isolation', 'shoulders'),
    ('Cable Front Raise', 'cable', true, 'Targets: anterior deltoid', 'isolation', 'shoulders'),
    ('Plate Front Raise', 'plate_loaded_machine', true, 'Targets: anterior deltoid', 'isolation', 'shoulders'),
    ('Upright Row', 'barbell', true, 'Targets: lateral deltoid, trapezius, upper', 'vertical_pull', 'shoulders'),
    ('Reverse Pec Deck', 'machine', true, 'Targets: posterior deltoid', 'isolation', 'shoulders'),
    ('Rear Delt Fly', 'dumbbell', true, 'Targets: posterior deltoid', 'isolation', 'shoulders'),
    ('Cable Rear Delt Fly', 'cable', true, 'Targets: posterior deltoid', 'isolation', 'shoulders'),
    ('Face Pull', 'cable', true, 'Targets: posterior deltoid, trapezius, middle', 'horizontal_pull', 'shoulders'),
    ('Tricep Pushdown', 'cable', true, 'Targets: triceps brachii, lateral head, triceps brachii, medial head', 'isolation', 'triceps'),
    ('Overhead Tricep Extension', 'dumbbell', true, 'Targets: triceps brachii, long head', 'isolation', 'triceps'),
    ('Cable Overhead Tricep Extension', 'cable', true, 'Targets: triceps brachii, long head', 'isolation', 'triceps'),
    ('Skull Crusher', 'barbell', true, 'Targets: triceps brachii, long head, triceps brachii, lateral head', 'isolation', 'triceps'),
    ('Tricep Kickback', 'dumbbell', true, 'Targets: triceps brachii, lateral head', 'isolation', 'triceps'),
    ('Cable Tricep Kickback', 'cable', true, 'Targets: triceps brachii, lateral head', 'isolation', 'triceps'),
    ('Bench Dip', 'bodyweight', true, 'Targets: triceps brachii, lateral head, triceps brachii, medial head', 'vertical_push', 'triceps'),
    ('Barbell Row', 'barbell', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Pendlay Row', 'barbell', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Dumbbell Row', 'dumbbell', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Chest-Supported Row', 'dumbbell', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('T-Bar Row', 'barbell', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Seated Cable Row', 'cable', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Machine Row', 'machine', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Pull-Up', 'bodyweight', true, 'Targets: latissimus dorsi, teres major', 'vertical_pull', 'back'),
    ('Chin-Up', 'bodyweight', true, 'Targets: latissimus dorsi, biceps brachii, long head, biceps brachii, short head', 'vertical_pull', 'back'),
    ('Neutral Grip Pull-Up', 'bodyweight', true, 'Targets: latissimus dorsi, teres major, brachialis', 'vertical_pull', 'back'),
    ('Lat Pulldown', 'cable', true, 'Targets: latissimus dorsi, teres major', 'vertical_pull', 'back'),
    ('Close-Grip Lat Pulldown', 'cable', true, 'Targets: latissimus dorsi, teres major', 'vertical_pull', 'back'),
    ('Wide-Grip Lat Pulldown', 'cable', true, 'Targets: latissimus dorsi, teres major', 'vertical_pull', 'back'),
    ('Straight-Arm Pulldown', 'cable', true, 'Targets: latissimus dorsi', 'isolation', 'back'),
    ('Machine Pullover', 'machine', true, 'Targets: latissimus dorsi', 'isolation', 'back'),
    ('Dumbbell Pullover', 'dumbbell', true, 'Targets: latissimus dorsi, pectoralis major', 'isolation', 'back'),
    ('Conventional Deadlift', 'barbell', true, 'Targets: erector spinae, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Sumo Deadlift', 'barbell', true, 'Targets: gluteus maximus, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'hip_hinge', 'back'),
    ('Trap Bar Deadlift', 'barbell', true, 'Targets: gluteus maximus, quadriceps, rectus femoris, quadriceps, vastus lateralis', 'hip_hinge', 'back'),
    ('Romanian Deadlift', 'barbell', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, semitendinosus, hamstrings, semimembranosus', 'hip_hinge', 'hamstrings'),
    ('Dumbbell Romanian Deadlift', 'dumbbell', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, semitendinosus, hamstrings, semimembranosus', 'hip_hinge', 'hamstrings'),
    ('Single-Leg Romanian Deadlift', 'dumbbell', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, semitendinosus, gluteus maximus', 'hip_hinge', 'hamstrings'),
    ('Stiff-Leg Deadlift', 'barbell', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, semitendinosus, hamstrings, semimembranosus', 'hip_hinge', 'hamstrings'),
    ('Good Morning', 'barbell', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, semitendinosus, erector spinae', 'hip_hinge', 'hamstrings'),
    ('Back Extension', 'bodyweight', true, 'Targets: erector spinae, gluteus maximus', 'hip_hinge', 'back'),
    ('Reverse Hyperextension', 'machine', true, 'Targets: gluteus maximus, erector spinae', 'hip_hinge', 'back'),
    ('Barbell Shrug', 'barbell', true, 'Targets: trapezius, upper', 'isolation', 'back'),
    ('Dumbbell Shrug', 'dumbbell', true, 'Targets: trapezius, upper', 'isolation', 'back'),
    ('Barbell Curl', 'barbell', true, 'Targets: biceps brachii, long head, biceps brachii, short head', 'isolation', 'biceps'),
    ('EZ Bar Curl', 'barbell', true, 'Targets: biceps brachii, long head, biceps brachii, short head', 'isolation', 'biceps'),
    ('Dumbbell Curl', 'dumbbell', true, 'Targets: biceps brachii, long head, biceps brachii, short head', 'isolation', 'biceps'),
    ('Incline Dumbbell Curl', 'dumbbell', true, 'Targets: biceps brachii, long head', 'isolation', 'biceps'),
    ('Preacher Curl', 'barbell', true, 'Targets: biceps brachii, short head', 'isolation', 'biceps'),
    ('Concentration Curl', 'dumbbell', true, 'Targets: biceps brachii, short head', 'isolation', 'biceps'),
    ('Cable Curl', 'cable', true, 'Targets: biceps brachii, long head, biceps brachii, short head', 'isolation', 'biceps'),
    ('Hammer Curl', 'dumbbell', true, 'Targets: brachialis, brachioradialis', 'isolation', 'biceps'),
    ('Cable Hammer Curl', 'cable', true, 'Targets: brachialis, brachioradialis', 'isolation', 'biceps'),
    ('Cross-Body Hammer Curl', 'dumbbell', true, 'Targets: brachialis', 'isolation', 'biceps'),
    ('Reverse Curl', 'barbell', true, 'Targets: brachioradialis, extensor carpi radialis', 'isolation', 'forearms'),
    ('Wrist Curl', 'barbell', true, 'Targets: flexor carpi radialis, flexor carpi ulnaris', 'isolation', 'forearms'),
    ('Reverse Wrist Curl', 'barbell', true, 'Targets: extensor carpi radialis, extensor carpi ulnaris', 'isolation', 'forearms'),
    ('Farmer Carry', 'dumbbell', true, 'Targets: flexor carpi radialis, flexor carpi ulnaris, trapezius, upper', 'carry', 'forearms'),
    ('Back Squat', 'barbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Front Squat', 'barbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Goblet Squat', 'dumbbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Hack Squat', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Smith Machine Squat', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Leg Press', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Leg Extension', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'isolation', 'quadriceps'),
    ('Sissy Squat', 'bodyweight', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'isolation', 'quadriceps'),
    ('Bulgarian Split Squat', 'dumbbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'lunge', 'quadriceps'),
    ('Walking Lunge', 'dumbbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'lunge', 'quadriceps'),
    ('Reverse Lunge', 'dumbbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, gluteus maximus', 'lunge', 'quadriceps'),
    ('Step-Up', 'dumbbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'lunge', 'quadriceps'),
    ('Lying Leg Curl', 'machine', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, biceps femoris short head, hamstrings, semitendinosus', 'isolation', 'hamstrings'),
    ('Seated Leg Curl', 'machine', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, biceps femoris short head, hamstrings, semitendinosus', 'isolation', 'hamstrings'),
    ('Nordic Curl', 'bodyweight', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, semitendinosus, hamstrings, semimembranosus', 'isolation', 'hamstrings'),
    ('Glute-Ham Raise', 'machine', true, 'Targets: hamstrings, biceps femoris long head, hamstrings, semitendinosus, hamstrings, semimembranosus', 'hip_hinge', 'hamstrings'),
    ('Hip Thrust', 'barbell', true, 'Targets: gluteus maximus', 'hip_hinge', 'glutes'),
    ('Glute Bridge', 'bodyweight', true, 'Targets: gluteus maximus', 'hip_hinge', 'glutes'),
    ('Single-Leg Glute Bridge', 'bodyweight', true, 'Targets: gluteus maximus, gluteus medius', 'hip_hinge', 'glutes'),
    ('Cable Pull-Through', 'cable', true, 'Targets: gluteus maximus', 'hip_hinge', 'glutes'),
    ('Kettlebell Swing', 'kettlebell', true, 'Targets: gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'glutes'),
    ('Cable Kickback', 'cable', true, 'Targets: gluteus maximus', 'isolation', 'glutes'),
    ('Hip Abduction Machine', 'machine', true, 'Targets: gluteus medius, gluteus minimus', 'isolation', 'glutes'),
    ('Side-Lying Hip Abduction', 'bodyweight', true, 'Targets: gluteus medius, gluteus minimus', 'isolation', 'glutes'),
    ('Clamshell', 'bodyweight', true, 'Targets: gluteus medius, piriformis', 'isolation', 'glutes'),
    ('Banded Walk', 'resistance_band', true, 'Targets: gluteus medius, gluteus minimus', 'isolation', 'glutes'),
    ('Hip Adduction Machine', 'machine', true, 'Targets: adductor magnus, adductor longus, adductor brevis', 'isolation', 'adductors'),
    ('Copenhagen Plank', 'bodyweight', true, 'Targets: adductor longus, adductor magnus', 'isolation', 'adductors'),
    ('Sumo Squat', 'dumbbell', true, 'Targets: quadriceps, vastus lateralis, quadriceps, vastus medialis, adductor magnus', 'squat', 'quadriceps'),
    ('Standing Calf Raise', 'machine', true, 'Targets: gastrocnemius, medial head, gastrocnemius, lateral head', 'isolation', 'calves'),
    ('Seated Calf Raise', 'machine', true, 'Targets: soleus', 'isolation', 'calves'),
    ('Leg Press Calf Raise', 'machine', true, 'Targets: gastrocnemius, medial head, gastrocnemius, lateral head', 'isolation', 'calves'),
    ('Donkey Calf Raise', 'machine', true, 'Targets: gastrocnemius, medial head, gastrocnemius, lateral head', 'isolation', 'calves'),
    ('Tibialis Raise', 'bodyweight', true, 'Targets: tibialis anterior', 'isolation', 'calves'),
    ('Crunch', 'bodyweight', true, 'Targets: rectus abdominis', 'isolation', 'core'),
    ('Cable Crunch', 'cable', true, 'Targets: rectus abdominis', 'isolation', 'core'),
    ('Hanging Leg Raise', 'bodyweight', true, 'Targets: rectus abdominis, iliopsoas', 'isolation', 'core'),
    ('Lying Leg Raise', 'bodyweight', true, 'Targets: rectus abdominis, iliopsoas', 'isolation', 'core'),
    ('Captain''s Chair Leg Raise', 'bodyweight', true, 'Targets: rectus abdominis, iliopsoas', 'isolation', 'core'),
    ('Plank', 'bodyweight', true, 'Targets: rectus abdominis, transverse abdominis', 'isolation', 'core'),
    ('Side Plank', 'bodyweight', true, 'Targets: external oblique, internal oblique', 'isolation', 'core'),
    ('Russian Twist', 'bodyweight', true, 'Targets: external oblique, internal oblique', 'rotation', 'core'),
    ('Bicycle Crunch', 'bodyweight', true, 'Targets: rectus abdominis, external oblique, internal oblique', 'rotation', 'core'),
    ('Woodchop', 'cable', true, 'Targets: external oblique, internal oblique', 'rotation', 'core'),
    ('Ab Wheel Rollout', 'bodyweight', true, 'Targets: rectus abdominis', 'isolation', 'core'),
    ('Dead Bug', 'bodyweight', true, 'Targets: rectus abdominis, transverse abdominis', 'isolation', 'core'),
    ('Pallof Press', 'cable', true, 'Targets: transverse abdominis, external oblique, internal oblique', 'rotation', 'core'),
    ('Decline Sit-Up', 'bodyweight', true, 'Targets: rectus abdominis, iliopsoas', 'isolation', 'core'),
    ('V-Up', 'bodyweight', true, 'Targets: rectus abdominis, iliopsoas', 'isolation', 'core'),
    ('Hollow Body Hold', 'bodyweight', true, 'Targets: rectus abdominis, transverse abdominis', 'isolation', 'core'),
    ('Cable External Rotation', 'cable', true, 'Targets: infraspinatus, teres minor', 'isolation', 'rotator_cuff'),
    ('Cable Internal Rotation', 'cable', true, 'Targets: subscapularis', 'isolation', 'rotator_cuff'),
    ('Band Pull-Apart', 'resistance_band', true, 'Targets: posterior deltoid, trapezius, middle', 'horizontal_pull', 'shoulders'),
    ('Cuban Press', 'dumbbell', true, 'Targets: infraspinatus, teres minor, lateral deltoid', 'isolation', 'rotator_cuff'),
    ('YTW Raises', 'dumbbell', true, 'Targets: trapezius, lower, trapezius, middle, posterior deltoid', 'isolation', 'back'),
    ('Serratus Punch', 'dumbbell', true, 'Targets: serratus anterior', 'isolation', 'shoulders'),
    ('Push-Up Plus', 'bodyweight', true, 'Targets: serratus anterior', 'horizontal_push', 'shoulders'),
    ('Neck Curl', 'plate_loaded_machine', true, 'Targets: sternocleidomastoid', 'isolation', 'neck'),
    ('Neck Extension', 'plate_loaded_machine', true, 'Targets: splenius capitis, semispinalis capitis', 'isolation', 'neck'),
    ('Neck Harness', 'plate_loaded_machine', true, 'Targets: sternocleidomastoid, splenius capitis, semispinalis capitis', 'isolation', 'neck'),
    ('Inverted Row', 'bodyweight', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Muscle-Up', 'bodyweight', true, 'Targets: latissimus dorsi, pectoralis major, triceps brachii, lateral head', 'vertical_pull', 'back'),
    ('Power Clean', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Hang Clean', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Snatch', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Clean and Jerk', 'barbell', true, 'Targets: trapezius, upper, gluteus maximus, quadriceps, rectus femoris', 'hip_hinge', 'back'),
    ('Thruster', 'barbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, anterior deltoid', 'squat', 'quadriceps'),
    ('Wall Ball', 'medicine_ball', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, gluteus maximus', 'squat', 'quadriceps'),
    ('Box Jump', 'bodyweight', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, gluteus maximus', 'squat', 'quadriceps'),
    ('Suitcase Carry', 'dumbbell', true, 'Targets: external oblique, internal oblique, flexor carpi radialis', 'carry', 'core'),
    ('Overhead Carry', 'dumbbell', true, 'Targets: anterior deltoid, lateral deltoid, trapezius, upper', 'carry', 'shoulders'),
    ('Rack Carry', 'kettlebell', true, 'Targets: rectus abdominis, external oblique, biceps brachii, short head', 'carry', 'core'),
    ('Spider Curl', 'dumbbell', true, 'Targets: biceps brachii, short head', 'isolation', 'biceps'),
    ('Machine Bicep Curl', 'machine', true, 'Targets: biceps brachii, long head, biceps brachii, short head', 'isolation', 'biceps'),
    ('Zottman Curl', 'dumbbell', true, 'Targets: biceps brachii, long head, biceps brachii, short head, brachioradialis', 'isolation', 'biceps'),
    ('Meadows Row', 'barbell', true, 'Targets: latissimus dorsi, teres major', 'horizontal_pull', 'back'),
    ('Kroc Row', 'dumbbell', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Seal Row', 'barbell', true, 'Targets: latissimus dorsi, trapezius, middle, rhomboid major', 'horizontal_pull', 'back'),
    ('Deficit Deadlift', 'barbell', true, 'Targets: erector spinae, gluteus maximus, hamstrings, biceps femoris long head', 'hip_hinge', 'back'),
    ('Pause Squat', 'barbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Safety Bar Squat', 'barbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Zercher Squat', 'barbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, gluteus maximus', 'squat', 'quadriceps'),
    ('Belt Squat', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Pendulum Squat', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Split Squat', 'dumbbell', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, gluteus maximus', 'lunge', 'quadriceps'),
    ('Pistol Squat', 'bodyweight', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Single-Leg Leg Press', 'machine', true, 'Targets: quadriceps, rectus femoris, quadriceps, vastus lateralis, quadriceps, vastus medialis', 'squat', 'quadriceps'),
    ('Glute Kickback Machine', 'machine', true, 'Targets: gluteus maximus', 'isolation', 'glutes'),
    ('Standing Cable Hip Extension', 'cable', true, 'Targets: gluteus maximus', 'isolation', 'glutes'),
    ('Standing Cable Hip Abduction', 'cable', true, 'Targets: gluteus medius, gluteus minimus', 'isolation', 'glutes'),
    ('Frog Pump', 'bodyweight', true, 'Targets: gluteus maximus', 'hip_hinge', 'glutes'),
    ('B-Stance Hip Thrust', 'barbell', true, 'Targets: gluteus maximus', 'hip_hinge', 'glutes'),
    ('Machine Hip Thrust', 'machine', true, 'Targets: gluteus maximus', 'hip_hinge', 'glutes')
ON CONFLICT DO NOTHING;

-- Insert exercise-muscle relations
-- Primary muscles
INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Barbell Bench Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Incline Barbell Bench Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Incline Barbell Bench Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Decline Barbell Bench Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Bench Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Incline Dumbbell Bench Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Incline Dumbbell Bench Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Flyes' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Incline Dumbbell Flyes' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Crossover' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Low Cable Crossover' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Chest Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pec Deck' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Push-Up' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Diamond Push-Up' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Diamond Push-Up' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Diamond Push-Up' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dips' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dips' AND m.name = 'pectoralis minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dips' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dips' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Bench Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Bench Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Overhead Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Overhead Press' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Dumbbell Shoulder Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Dumbbell Shoulder Press' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Arnold Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Arnold Press' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Shoulder Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Shoulder Press' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Push Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Push Press' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Landmine Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Landmine Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Lateral Raise' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Lateral Raise' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Lateral Raise' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Front Raise' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Front Raise' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plate Front Raise' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Upright Row' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Upright Row' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Pec Deck' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Rear Delt Fly' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Rear Delt Fly' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Face Pull' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Face Pull' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Tricep Pushdown' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Tricep Pushdown' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Overhead Tricep Extension' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Overhead Tricep Extension' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Skull Crusher' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Skull Crusher' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Tricep Kickback' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Tricep Kickback' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Bench Dip' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Bench Dip' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Barbell Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Barbell Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Barbell Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Barbell Row' AND m.name = 'rhomboid minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pendlay Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pendlay Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pendlay Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'T-Bar Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'T-Bar Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'T-Bar Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'T-Bar Row' AND m.name = 'rhomboid minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pull-Up' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pull-Up' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chin-Up' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chin-Up' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Chin-Up' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Neutral Grip Pull-Up' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Neutral Grip Pull-Up' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Neutral Grip Pull-Up' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Lat Pulldown' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Lat Pulldown' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Lat Pulldown' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Lat Pulldown' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Wide-Grip Lat Pulldown' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Wide-Grip Lat Pulldown' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Straight-Arm Pulldown' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Pullover' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Pullover' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Pullover' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sumo Deadlift' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sumo Deadlift' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sumo Deadlift' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sumo Deadlift' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Trap Bar Deadlift' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Trap Bar Deadlift' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Trap Bar Deadlift' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Trap Bar Deadlift' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Romanian Deadlift' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Romanian Deadlift' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Romanian Deadlift' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Romanian Deadlift' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Romanian Deadlift' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Romanian Deadlift' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Romanian Deadlift' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Romanian Deadlift' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Romanian Deadlift' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Romanian Deadlift' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Romanian Deadlift' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Stiff-Leg Deadlift' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Stiff-Leg Deadlift' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Stiff-Leg Deadlift' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Good Morning' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Good Morning' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Good Morning' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Back Extension' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Back Extension' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Hyperextension' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Hyperextension' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Barbell Shrug' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Shrug' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Barbell Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Barbell Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'EZ Bar Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'EZ Bar Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Incline Dumbbell Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Preacher Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Concentration Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hammer Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hammer Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Hammer Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Hammer Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cross-Body Hammer Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Curl' AND m.name = 'extensor carpi radialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Wrist Curl' AND m.name = 'flexor carpi radialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Wrist Curl' AND m.name = 'flexor carpi ulnaris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Wrist Curl' AND m.name = 'extensor carpi radialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Wrist Curl' AND m.name = 'extensor carpi ulnaris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Farmer Carry' AND m.name = 'flexor carpi radialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Farmer Carry' AND m.name = 'flexor carpi ulnaris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Farmer Carry' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Back Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Back Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Back Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Back Squat' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Back Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Front Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Front Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Front Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Front Squat' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Goblet Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Goblet Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Goblet Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hack Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hack Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hack Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hack Squat' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Smith Machine Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Smith Machine Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Smith Machine Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Extension' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Extension' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Extension' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Extension' AND m.name = 'quadriceps, vastus intermedius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sissy Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sissy Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sissy Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Bulgarian Split Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Bulgarian Split Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Bulgarian Split Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Bulgarian Split Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Walking Lunge' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Walking Lunge' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Walking Lunge' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Walking Lunge' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Lunge' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Lunge' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Reverse Lunge' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Step-Up' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Step-Up' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Step-Up' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Step-Up' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Lying Leg Curl' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Lying Leg Curl' AND m.name = 'hamstrings, biceps femoris short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Lying Leg Curl' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Lying Leg Curl' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Leg Curl' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Leg Curl' AND m.name = 'hamstrings, biceps femoris short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Leg Curl' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Leg Curl' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Nordic Curl' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Nordic Curl' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Nordic Curl' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Glute-Ham Raise' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Glute-Ham Raise' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Glute-Ham Raise' AND m.name = 'hamstrings, semimembranosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Glute-Ham Raise' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hip Thrust' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Glute Bridge' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Glute Bridge' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Glute Bridge' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Pull-Through' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Kettlebell Swing' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Kettlebell Swing' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Kickback' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hip Abduction Machine' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hip Abduction Machine' AND m.name = 'gluteus minimus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Side-Lying Hip Abduction' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Side-Lying Hip Abduction' AND m.name = 'gluteus minimus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Clamshell' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Clamshell' AND m.name = 'piriformis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Banded Walk' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Banded Walk' AND m.name = 'gluteus minimus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hip Adduction Machine' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hip Adduction Machine' AND m.name = 'adductor longus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hip Adduction Machine' AND m.name = 'adductor brevis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hip Adduction Machine' AND m.name = 'gracilis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Copenhagen Plank' AND m.name = 'adductor longus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Copenhagen Plank' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sumo Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sumo Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sumo Squat' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Sumo Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Standing Calf Raise' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Standing Calf Raise' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seated Calf Raise' AND m.name = 'soleus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Calf Raise' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Calf Raise' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Donkey Calf Raise' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Donkey Calf Raise' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Tibialis Raise' AND m.name = 'tibialis anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Crunch' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Crunch' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hanging Leg Raise' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hanging Leg Raise' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Lying Leg Raise' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Lying Leg Raise' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Captain''s Chair Leg Raise' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Captain''s Chair Leg Raise' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plank' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Plank' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Side Plank' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Side Plank' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Russian Twist' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Russian Twist' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Bicycle Crunch' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Bicycle Crunch' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Bicycle Crunch' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Woodchop' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Woodchop' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Ab Wheel Rollout' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dead Bug' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Dead Bug' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pallof Press' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pallof Press' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pallof Press' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Decline Sit-Up' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Decline Sit-Up' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'V-Up' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'V-Up' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hollow Body Hold' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hollow Body Hold' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable External Rotation' AND m.name = 'infraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable External Rotation' AND m.name = 'teres minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cable Internal Rotation' AND m.name = 'subscapularis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Band Pull-Apart' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Band Pull-Apart' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cuban Press' AND m.name = 'infraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cuban Press' AND m.name = 'teres minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Cuban Press' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'YTW Raises' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'YTW Raises' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'YTW Raises' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Serratus Punch' AND m.name = 'serratus anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Push-Up Plus' AND m.name = 'serratus anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Neck Curl' AND m.name = 'sternocleidomastoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Neck Extension' AND m.name = 'splenius capitis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Neck Extension' AND m.name = 'semispinalis capitis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Neck Harness' AND m.name = 'sternocleidomastoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Neck Harness' AND m.name = 'splenius capitis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Neck Harness' AND m.name = 'semispinalis capitis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Inverted Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Inverted Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Inverted Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Muscle-Up' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Muscle-Up' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Muscle-Up' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Power Clean' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Power Clean' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Power Clean' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Power Clean' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hang Clean' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hang Clean' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Hang Clean' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Snatch' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Clean and Jerk' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Clean and Jerk' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Clean and Jerk' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Clean and Jerk' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Thruster' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Thruster' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Thruster' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Thruster' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Wall Ball' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Wall Ball' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Wall Ball' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Wall Ball' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Box Jump' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Box Jump' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Box Jump' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Box Jump' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Carry' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Carry' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Carry' AND m.name = 'flexor carpi radialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Overhead Carry' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Overhead Carry' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Overhead Carry' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Rack Carry' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Rack Carry' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Rack Carry' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Spider Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Bicep Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Bicep Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Zottman Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Zottman Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Zottman Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Meadows Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Meadows Row' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Kroc Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Kroc Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Kroc Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seal Row' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seal Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seal Row' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Seal Row' AND m.name = 'rhomboid minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Deficit Deadlift' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Deficit Deadlift' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Deficit Deadlift' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Deficit Deadlift' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pause Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pause Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pause Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pause Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Safety Bar Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Safety Bar Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Safety Bar Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Safety Bar Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Zercher Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Zercher Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Zercher Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Zercher Squat' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Belt Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Belt Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Belt Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Belt Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pendulum Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pendulum Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pendulum Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Split Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Split Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Split Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pistol Squat' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pistol Squat' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pistol Squat' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Pistol Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Leg Press' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Leg Press' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Leg Press' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Glute Kickback Machine' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Standing Cable Hip Extension' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Standing Cable Hip Abduction' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Standing Cable Hip Abduction' AND m.name = 'gluteus minimus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Frog Pump' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'B-Stance Hip Thrust' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, true
FROM exercises e, muscles m
WHERE e.name = 'Machine Hip Thrust' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

-- Secondary muscles
INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Barbell Bench Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Barbell Bench Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Barbell Bench Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Incline Barbell Bench Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Incline Barbell Bench Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Decline Barbell Bench Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Decline Barbell Bench Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Decline Barbell Bench Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Bench Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Bench Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Bench Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Incline Dumbbell Bench Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Incline Dumbbell Bench Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Flyes' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Incline Dumbbell Flyes' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Crossover' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Low Cable Crossover' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Chest Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Chest Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push-Up' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push-Up' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push-Up' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push-Up' AND m.name = 'serratus anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Diamond Push-Up' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Diamond Push-Up' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dips' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dips' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Bench Press' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Bench Press' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Bench Press' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Overhead Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Overhead Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Overhead Press' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Overhead Press' AND m.name = 'serratus anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Dumbbell Shoulder Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Dumbbell Shoulder Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Dumbbell Shoulder Press' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Arnold Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Arnold Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Shoulder Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Shoulder Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push Press' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push Press' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push Press' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Landmine Press' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Landmine Press' AND m.name = 'serratus anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Lateral Raise' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Lateral Raise' AND m.name = 'supraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Lateral Raise' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Lateral Raise' AND m.name = 'supraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Lateral Raise' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Front Raise' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Front Raise' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Front Raise' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plate Front Raise' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Upright Row' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Upright Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Upright Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Pec Deck' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Pec Deck' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Pec Deck' AND m.name = 'rhomboid minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rear Delt Fly' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rear Delt Fly' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rear Delt Fly' AND m.name = 'rhomboid minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Rear Delt Fly' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Rear Delt Fly' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Face Pull' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Face Pull' AND m.name = 'rhomboid minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Face Pull' AND m.name = 'infraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Face Pull' AND m.name = 'teres minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Face Pull' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Overhead Tricep Extension' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Overhead Tricep Extension' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Overhead Tricep Extension' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Overhead Tricep Extension' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Skull Crusher' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Tricep Kickback' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Tricep Kickback' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Tricep Kickback' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Tricep Kickback' AND m.name = 'triceps brachii, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Bench Dip' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Bench Dip' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Barbell Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Barbell Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Barbell Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Barbell Row' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pendlay Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pendlay Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pendlay Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pendlay Row' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Row' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chest-Supported Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'T-Bar Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'T-Bar Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'T-Bar Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'T-Bar Row' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Cable Row' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pull-Up' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pull-Up' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pull-Up' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pull-Up' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pull-Up' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chin-Up' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chin-Up' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chin-Up' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Chin-Up' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Neutral Grip Pull-Up' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Neutral Grip Pull-Up' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Neutral Grip Pull-Up' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Lat Pulldown' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Lat Pulldown' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Lat Pulldown' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Lat Pulldown' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Lat Pulldown' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Lat Pulldown' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Lat Pulldown' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Close-Grip Lat Pulldown' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Wide-Grip Lat Pulldown' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Wide-Grip Lat Pulldown' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Wide-Grip Lat Pulldown' AND m.name = 'trapezius, lower'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Straight-Arm Pulldown' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Straight-Arm Pulldown' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Straight-Arm Pulldown' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Pullover' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Pullover' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Pullover' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Pullover' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Pullover' AND m.name = 'serratus anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'quadriceps, vastus lateralis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Conventional Deadlift' AND m.name = 'quadriceps, vastus medialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Sumo Deadlift' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Sumo Deadlift' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Sumo Deadlift' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Trap Bar Deadlift' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Trap Bar Deadlift' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Trap Bar Deadlift' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Romanian Deadlift' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Romanian Deadlift' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Romanian Deadlift' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Romanian Deadlift' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Romanian Deadlift' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Romanian Deadlift' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Stiff-Leg Deadlift' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Stiff-Leg Deadlift' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Good Morning' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Back Extension' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Back Extension' AND m.name = 'hamstrings, semitendinosus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Hyperextension' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Barbell Shrug' AND m.name = 'levator scapulae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Shrug' AND m.name = 'levator scapulae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Barbell Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Barbell Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'EZ Bar Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'EZ Bar Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dumbbell Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Incline Dumbbell Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Incline Dumbbell Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Preacher Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Preacher Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Concentration Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Concentration Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hammer Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hammer Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Hammer Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Hammer Curl' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cross-Body Hammer Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cross-Body Hammer Curl' AND m.name = 'brachioradialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Farmer Carry' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Farmer Carry' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Farmer Carry' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Back Squat' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Back Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Back Squat' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Front Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Front Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Goblet Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Goblet Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hack Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Smith Machine Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Leg Press' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Leg Press' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Bulgarian Split Squat' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Bulgarian Split Squat' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Walking Lunge' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Walking Lunge' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Lunge' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Reverse Lunge' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Step-Up' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Lying Leg Curl' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Lying Leg Curl' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Leg Curl' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Nordic Curl' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Nordic Curl' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Glute-Ham Raise' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Glute-Ham Raise' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hip Thrust' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hip Thrust' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hip Thrust' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Glute Bridge' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Glute Bridge' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Pull-Through' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Pull-Through' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Kettlebell Swing' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Kettlebell Swing' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Kettlebell Swing' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Kickback' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hip Abduction Machine' AND m.name = 'tensor fasciae latae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Side-Lying Hip Abduction' AND m.name = 'tensor fasciae latae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Clamshell' AND m.name = 'gluteus minimus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Banded Walk' AND m.name = 'tensor fasciae latae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Copenhagen Plank' AND m.name = 'gracilis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Copenhagen Plank' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Copenhagen Plank' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Sumo Squat' AND m.name = 'adductor longus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Sumo Squat' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Standing Calf Raise' AND m.name = 'soleus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Calf Raise' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seated Calf Raise' AND m.name = 'gastrocnemius, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Leg Press Calf Raise' AND m.name = 'soleus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Donkey Calf Raise' AND m.name = 'soleus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Crunch' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Crunch' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Crunch' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable Crunch' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hanging Leg Raise' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hanging Leg Raise' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Lying Leg Raise' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Captain''s Chair Leg Raise' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Captain''s Chair Leg Raise' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plank' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plank' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Plank' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Side Plank' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Side Plank' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Side Plank' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Russian Twist' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Bicycle Crunch' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Woodchop' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Woodchop' AND m.name = 'transverse abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Woodchop' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Ab Wheel Rollout' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Ab Wheel Rollout' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Ab Wheel Rollout' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dead Bug' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dead Bug' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Dead Bug' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pallof Press' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Decline Sit-Up' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Decline Sit-Up' AND m.name = 'internal oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'V-Up' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hollow Body Hold' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hollow Body Hold' AND m.name = 'external oblique'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cable External Rotation' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Band Pull-Apart' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Band Pull-Apart' AND m.name = 'rhomboid minor'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cuban Press' AND m.name = 'supraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Cuban Press' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'YTW Raises' AND m.name = 'rhomboid major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'YTW Raises' AND m.name = 'infraspinatus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Serratus Punch' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push-Up Plus' AND m.name = 'pectoralis major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push-Up Plus' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Push-Up Plus' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Neck Extension' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Inverted Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Inverted Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Inverted Row' AND m.name = 'biceps brachii, short head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Muscle-Up' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Muscle-Up' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Muscle-Up' AND m.name = 'teres major'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Power Clean' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Power Clean' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Power Clean' AND m.name = 'gastrocnemius, medial head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hang Clean' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hang Clean' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Hang Clean' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch' AND m.name = 'quadriceps, rectus femoris'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Snatch' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Clean and Jerk' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Clean and Jerk' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Clean and Jerk' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Thruster' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Thruster' AND m.name = 'lateral deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Thruster' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Wall Ball' AND m.name = 'triceps brachii, lateral head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Wall Ball' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Box Jump' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Box Jump' AND m.name = 'soleus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Carry' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Carry' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Suitcase Carry' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Overhead Carry' AND m.name = 'triceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Overhead Carry' AND m.name = 'serratus anterior'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Overhead Carry' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rack Carry' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Rack Carry' AND m.name = 'anterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Spider Curl' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Spider Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Bicep Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Zottman Curl' AND m.name = 'brachialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Zottman Curl' AND m.name = 'extensor carpi radialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Meadows Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Meadows Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Meadows Row' AND m.name = 'trapezius, middle'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Kroc Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Kroc Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Kroc Row' AND m.name = 'flexor carpi radialis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seal Row' AND m.name = 'posterior deltoid'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Seal Row' AND m.name = 'biceps brachii, long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Deficit Deadlift' AND m.name = 'latissimus dorsi'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Deficit Deadlift' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pause Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pause Squat' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Safety Bar Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Safety Bar Squat' AND m.name = 'trapezius, upper'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Zercher Squat' AND m.name = 'erector spinae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Zercher Squat' AND m.name = 'rectus abdominis'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pendulum Squat' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Split Squat' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Split Squat' AND m.name = 'adductor magnus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pistol Squat' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Pistol Squat' AND m.name = 'iliopsoas'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Leg Press' AND m.name = 'gluteus maximus'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Single-Leg Leg Press' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Glute Kickback Machine' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Standing Cable Hip Extension' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Standing Cable Hip Abduction' AND m.name = 'tensor fasciae latae'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'B-Stance Hip Thrust' AND m.name = 'gluteus medius'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'B-Stance Hip Thrust' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, false
FROM exercises e, muscles m
WHERE e.name = 'Machine Hip Thrust' AND m.name = 'hamstrings, biceps femoris long head'
ON CONFLICT DO NOTHING;

COMMIT;