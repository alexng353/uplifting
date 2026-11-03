import type { StoredWorkoutExercise } from "../services/storage";

/** Bilateral: one row per set. Unilateral: L and R in one row. Split: L and R rows. */
export type SideMode = "bilateral" | "unilateral" | "split";

export const SIDE_MODES: { mode: SideMode; label: string }[] = [
  { mode: "bilateral", label: "Bilateral" },
  { mode: "unilateral", label: "Unilateral" },
  { mode: "split", label: "Split" },
];

// Exercises saved before the three-way control were sided with separate rows, so an
// unset layout means split.
export function sideModeOf(
  exercise: Pick<StoredWorkoutExercise, "isUnilateral" | "sideLayout">,
): SideMode {
  if (!exercise.isUnilateral) return "bilateral";
  return exercise.sideLayout === "combined" ? "unilateral" : "split";
}
