import { readFileSync, writeFileSync } from "fs";

interface GymMuscle {
  muscle: string;
  location: string;
  category: string;
  common_name: string;
  action: string;
  common_exercises: string[];
}

interface Exercise {
  name: string;
  movement_pattern: string;
  equipment: string[];
  muscle_group: string;
  primary_muscles: string[];
  secondary_muscles: string[];
}

// Map our equipment types to the existing exercise_type enum
const equipmentToExerciseType: Record<string, string> = {
  barbell: "barbell",
  dumbbell: "dumbbell",
  cable: "cable",
  machine: "machine",
  bodyweight: "bodyweight",
  kettlebell: "kettlebell",
  band: "resistance_band",
  ez_bar: "barbell",
  trap_bar: "barbell",
  smith_machine: "machine",
  suspension: "bodyweight",
  landmine: "barbell",
  medicine_ball: "medicine_ball",
  plate: "plate_loaded_machine",
};

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function generateMigration(): string {
  const muscles: GymMuscle[] = JSON.parse(
    readFileSync("./gym-muscles.json", "utf-8")
  );
  const exercises: Exercise[] = JSON.parse(
    readFileSync("./exercises.json", "utf-8")
  );

  const lines: string[] = [];

  lines.push("-- Generated migration for official exercises and muscles");
  lines.push(`-- Generated at: ${new Date().toISOString()}`);
  lines.push("");

  // Start transaction
  lines.push("BEGIN;");
  lines.push("");

  // Add movement_pattern column to exercises if we want to track it
  lines.push("-- Add movement pattern to exercises");
  lines.push(
    "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS movement_pattern VARCHAR(50);"
  );
  lines.push(
    "ALTER TABLE exercises ADD COLUMN IF NOT EXISTS muscle_group VARCHAR(50);"
  );
  lines.push("");

  // Insert muscles with a CTE to track their IDs
  lines.push("-- Insert official gym muscles");
  lines.push("INSERT INTO muscles (name, scientific_name, major_group, minor_group)");
  lines.push("VALUES");

  const muscleValues = muscles.map((m, i) => {
    const scientificName = m.muscle;
    const majorGroup = m.category;
    const minorGroup = m.common_name;
    const comma = i < muscles.length - 1 ? "," : "";
    return `    ('${escapeSQL(m.muscle)}', '${escapeSQL(scientificName)}', '${escapeSQL(majorGroup)}', '${escapeSQL(minorGroup)}')${comma}`;
  });
  lines.push(...muscleValues);
  lines.push("ON CONFLICT DO NOTHING;");
  lines.push("");

  // Insert exercises
  lines.push("-- Insert official exercises");
  lines.push("INSERT INTO exercises (name, exercise_type, official, description, movement_pattern, muscle_group)");
  lines.push("VALUES");

  const exerciseValues = exercises.map((e, i) => {
    // Use first equipment type for the exercise_type enum
    const exerciseType = equipmentToExerciseType[e.equipment[0]] || "machine";
    const description = `Targets: ${e.primary_muscles.slice(0, 3).join(", ")}`;
    const comma = i < exercises.length - 1 ? "," : "";
    return `    ('${escapeSQL(e.name)}', '${exerciseType}', true, '${escapeSQL(description)}', '${escapeSQL(e.movement_pattern)}', '${escapeSQL(e.muscle_group)}')${comma}`;
  });
  lines.push(...exerciseValues);
  lines.push("ON CONFLICT DO NOTHING;");
  lines.push("");

  // Insert exercise-muscle relations
  lines.push("-- Insert exercise-muscle relations");
  lines.push("-- Primary muscles");

  for (const exercise of exercises) {
    for (const muscle of exercise.primary_muscles) {
      lines.push(`INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)`);
      lines.push(`SELECT e.id, m.id, true`);
      lines.push(`FROM exercises e, muscles m`);
      lines.push(`WHERE e.name = '${escapeSQL(exercise.name)}' AND m.name = '${escapeSQL(muscle)}'`);
      lines.push(`ON CONFLICT DO NOTHING;`);
      lines.push("");
    }
  }

  lines.push("-- Secondary muscles");
  for (const exercise of exercises) {
    for (const muscle of exercise.secondary_muscles) {
      lines.push(`INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)`);
      lines.push(`SELECT e.id, m.id, false`);
      lines.push(`FROM exercises e, muscles m`);
      lines.push(`WHERE e.name = '${escapeSQL(exercise.name)}' AND m.name = '${escapeSQL(muscle)}'`);
      lines.push(`ON CONFLICT DO NOTHING;`);
      lines.push("");
    }
  }

  lines.push("COMMIT;");

  return lines.join("\n");
}

// Generate and write
const migration = generateMigration();
const timestamp = new Date()
  .toISOString()
  .replace(/[-:T]/g, "")
  .slice(0, 14);
const filename = `../migrations/${timestamp}_official_gym_data.sql`;

writeFileSync(filename, migration);
console.log(`Generated migration: ${filename}`);

// Also output stats
const muscles: GymMuscle[] = JSON.parse(
  readFileSync("./gym-muscles.json", "utf-8")
);
const exercises: Exercise[] = JSON.parse(
  readFileSync("./exercises.json", "utf-8")
);

let primaryRelations = 0;
let secondaryRelations = 0;
for (const e of exercises) {
  primaryRelations += e.primary_muscles.length;
  secondaryRelations += e.secondary_muscles.length;
}

console.log(`\nStats:`);
console.log(`  Muscles: ${muscles.length}`);
console.log(`  Exercises: ${exercises.length}`);
console.log(`  Primary muscle relations: ${primaryRelations}`);
console.log(`  Secondary muscle relations: ${secondaryRelations}`);
console.log(`  Total relations: ${primaryRelations + secondaryRelations}`);
