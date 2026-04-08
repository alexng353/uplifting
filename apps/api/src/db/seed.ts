import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

// Path to original Uplifting repo migration files (sibling repo)
const MIGRATIONS_DIR = join(__dirname, "../../../..", "..", "uplifting", "api", "migrations");

const MIGRATION_FILES = [
  "20260115105435_official_gym_data.sql",
  "20260125120000_more_official_exercises.sql",
  "20260125131500_more_official_exercises.sql",
  "20260125143000_standing_leg_press.sql",
  "20260125160000_plate_loaded_standing_leg_curl_machine.sql",
];

/**
 * Extract executable INSERT statements from a migration SQL file.
 * Strips out ALTER TABLE, BEGIN, COMMIT, and comment lines.
 * Returns an array of complete SQL statements.
 */
function extractInsertStatements(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const statements: string[] = [];
  let current: string[] = [];
  let inInsert = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines, comments, DDL, and transaction control
    if (!inInsert) {
      if (
        trimmed === "" ||
        trimmed.startsWith("--") ||
        trimmed.startsWith("ALTER ") ||
        trimmed === "BEGIN;" ||
        trimmed === "COMMIT;"
      ) {
        continue;
      }

      // Start of an INSERT statement
      if (trimmed.startsWith("INSERT INTO")) {
        inInsert = true;
        current = [line];
        // Check if it's a single-line statement
        if (trimmed.endsWith(";")) {
          statements.push(current.join("\n"));
          current = [];
          inInsert = false;
        }
        continue;
      }

      continue;
    }

    // We're inside a multi-line INSERT statement
    current.push(line);

    // Check for statement termination
    if (trimmed.endsWith(";")) {
      statements.push(current.join("\n"));
      current = [];
      inInsert = false;
    }
  }

  return statements;
}

async function seed() {
  console.log("Checking if seed data already exists...");

  const [{ count: muscleCount }] = await sql`SELECT count(*)::int as count FROM muscles`;
  const [{ count: exerciseCount }] = await sql`SELECT count(*)::int as count FROM exercises`;

  if (muscleCount > 0 || exerciseCount > 0) {
    console.log(
      `Database already has ${muscleCount} muscles and ${exerciseCount} exercises. Skipping seed.`
    );
    await sql.end();
    return;
  }

  console.log("Seeding database with official muscles and exercises...\n");

  let totalStatements = 0;

  for (const file of MIGRATION_FILES) {
    const filePath = join(MIGRATIONS_DIR, file);
    console.log(`Processing: ${file}`);

    const statements = extractInsertStatements(filePath);
    console.log(`  Found ${statements.length} INSERT statements`);

    // Execute all statements in a single transaction per file
    await sql.begin(async (tx) => {
      for (const stmt of statements) {
        await tx.unsafe(stmt);
      }
    });

    totalStatements += statements.length;
  }

  // Verify
  const [{ count: finalMuscles }] = await sql`SELECT count(*)::int as count FROM muscles`;
  const [{ count: finalExercises }] = await sql`SELECT count(*)::int as count FROM exercises`;
  const [{ count: finalRelations }] =
    await sql`SELECT count(*)::int as count FROM exercise_muscle_relations`;

  console.log(`\nSeed complete!`);
  console.log(`  Muscles:   ${finalMuscles}`);
  console.log(`  Exercises: ${finalExercises}`);
  console.log(`  Relations: ${finalRelations}`);

  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  sql.end().then(() => process.exit(1));
});
