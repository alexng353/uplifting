import { convertWeight } from "./units";

/** How a finished set compares with what was suggested for it. */
export type SetResult = "above" | "same" | "below";

export interface Lift {
  reps?: number | null;
  weight?: number | null;
  weightUnit?: string | null;
}

// Within 1.5% of the suggestion's estimated 1RM counts as the same set: smaller gaps are noise.
const SAME_TOLERANCE = 0.015;

/** Epley estimated one-rep max: w * (1 + reps / 30). Bodyweight-only sets use reps. */
export function estimatedOneRepMax(weight: number, reps: number): number {
  return weight > 0 ? weight * (1 + reps / 30) : reps;
}

/**
 * Compares a done set with its suggestion on estimated 1RM, so 8x135 vs a suggested
 * 6x140 is not called below. Null when either side lacks reps (no suggestion, not done).
 */
export function compareSet(done: Lift, suggested: Lift, unit: string): SetResult | null {
  if (done.reps == null || suggested.reps == null) return null;
  const doneW = done.weight ?? 0;
  const sugW = convertWeight(suggested.weight ?? 0, suggested.weightUnit ?? unit, unit);
  if (done.reps === suggested.reps && Math.abs(doneW - sugW) < 1e-9) return "same";
  const a = estimatedOneRepMax(doneW, done.reps);
  const b = estimatedOneRepMax(sugW, suggested.reps);
  if (b <= 0) return null;
  const diff = (a - b) / b;
  if (Math.abs(diff) <= SAME_TOLERANCE) return "same";
  return diff > 0 ? "above" : "below";
}

/** A unilateral or split row shows its worse side. */
export function worseResult(results: (SetResult | null)[]): SetResult | null {
  const known = results.filter((r): r is SetResult => r != null);
  if (known.length === 0) return null;
  if (known.includes("below")) return "below";
  if (known.includes("same")) return "same";
  return "above";
}
