/**
 * Resolving an exercise from either a UUID or a human name.
 *
 * Models describe exercises the way people do ("incline dumbbell press"), so
 * every write tool accepts a name. Resolution is deliberately strict: an
 * ambiguous or unknown name fails with the candidates rather than guessing,
 * because guessing here silently writes a lifter's sets against the wrong
 * movement.
 */
import { sql } from "../../db";

export interface ResolvedExercise {
  id: string;
  name: string;
  exercise_type: string;
}

export type ExerciseLookup =
  | { ok: true; exercise: ResolvedExercise }
  | { ok: false; message: string };

export async function resolveExercise(
  userId: string,
  exerciseId?: string,
  exerciseName?: string,
): Promise<ExerciseLookup> {
  if (exerciseId) {
    const rows = await sql`
      SELECT id, name, exercise_type FROM exercises
      WHERE id = ${exerciseId} AND (official = true OR author_id = ${userId})
      LIMIT 1
    `;
    if (rows.length === 0) {
      return {
        ok: false,
        message: `Error: no exercise with id ${exerciseId} is visible to this user. Use uplifting_search_exercises to find the right ID.`,
      };
    }
    return { ok: true, exercise: toResolved(rows[0]) };
  }

  if (!exerciseName) {
    return { ok: false, message: "Error: provide either exercise_id or exercise_name." };
  }

  const exact = await sql`
    SELECT id, name, exercise_type FROM exercises
    WHERE LOWER(name) = LOWER(${exerciseName}) AND (official = true OR author_id = ${userId})
    ORDER BY official DESC
    LIMIT 5
  `;

  if (exact.length === 1) return { ok: true, exercise: toResolved(exact[0]) };

  if (exact.length > 1) {
    const candidates = exact.map((row) => `"${row.name}" (${row.id})`).join(", ");
    return {
      ok: false,
      message: `Error: "${exerciseName}" matches several exercises: ${candidates}. Call again with exercise_id.`,
    };
  }

  // No exact hit — offer substring matches so the model can retry precisely.
  const similar = await sql`
    SELECT id, name FROM exercises
    WHERE LOWER(name) LIKE LOWER(${`%${exerciseName}%`}) AND (official = true OR author_id = ${userId})
    ORDER BY official DESC, LENGTH(name) ASC
    LIMIT 8
  `;

  if (similar.length === 0) {
    return {
      ok: false,
      message: `Error: no exercise named "${exerciseName}" was found. Search for the movement with uplifting_search_exercises first; if it genuinely doesn't exist, pick the closest official exercise.`,
    };
  }

  const suggestions = similar.map((row) => `"${row.name}" (${row.id})`).join(", ");
  return {
    ok: false,
    message: `Error: no exercise is named exactly "${exerciseName}". Closest matches: ${suggestions}. Call again with exercise_id or the exact name.`,
  };
}

function toResolved(row: Record<string, unknown>): ResolvedExercise {
  return {
    id: row.id as string,
    name: row.name as string,
    exercise_type: (row.exercise_type as string) ?? "",
  };
}
