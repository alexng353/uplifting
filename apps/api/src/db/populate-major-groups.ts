/**
 * Populate the `major_group` column on the `muscles` table.
 *
 * The column already exists in the schema but is NULL for rows inserted by
 * the external seed SQL files. This script applies the same mapping that was
 * previously hardcoded in `MUSCLE_GROUP_MAP` (src/routes/workouts.ts).
 *
 * Usage:  bun run apps/api/src/db/populate-major-groups.ts
 */
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

const MAJOR_GROUP_MAP: Record<string, string[]> = {
  Shoulders: ["front delt", "side delt", "rear delt", "rotator cuff", "serratus", "levator scap"],
  Chest: ["chest"],
  Back: ["upper back", "lats", "lower back", "traps", "rhomboids"],
  Arms: ["biceps", "triceps", "forearms", "brachialis"],
  Legs: [
    "quads",
    "hamstrings",
    "glutes",
    "calves",
    "adductors",
    "abductors",
    "hip flexors",
    "tibialis",
  ],
  Core: ["abs", "obliques", "transverse abdominis", "spinal erectors"],
};

async function populate() {
  console.log("Populating muscles.major_group...\n");

  for (const [majorGroup, minorGroups] of Object.entries(MAJOR_GROUP_MAP)) {
    const result = await sql`
      UPDATE muscles
      SET major_group = ${majorGroup}
      WHERE minor_group = ANY(${minorGroups})
        AND (major_group IS NULL OR major_group != ${majorGroup})
    `;
    console.log(`  ${majorGroup}: ${result.count} rows updated`);
  }

  // Catch-all for any muscles not in the map
  const remaining = await sql`
    UPDATE muscles
    SET major_group = 'Other'
    WHERE major_group IS NULL
  `;
  console.log(`  Other: ${remaining.count} rows updated`);

  console.log("\nDone.");
  await sql.end();
}

populate().catch((err) => {
  console.error("Failed to populate major_group:", err);
  sql.end().then(() => process.exit(1));
});
