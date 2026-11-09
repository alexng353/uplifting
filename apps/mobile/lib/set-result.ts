import { convertWeight } from "./units";
import { splitSession } from "./previous-sets";
import type { StoredSet } from "../services/storage";

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
 * Compares a done set with its suggestion. Without a rep floor, on estimated 1RM, so 8x135
 * vs a suggested 6x140 is not called below. With the bottom of his rep range (double
 * progression): heavier is up while reps stay in the range (8x40 then 6x45); at the same
 * weight reps decide; lighter is down unless the e1RM beats last time by more than 1.5%;
 * a heavier set below the range falls back to e1RM. Null when either side lacks reps.
 */
export function compareSet(
  done: Lift,
  suggested: Lift,
  unit: string,
  repFloor?: number | null,
): SetResult | null {
  if (done.reps == null || suggested.reps == null) return null;
  const doneW = done.weight ?? 0;
  const sugW = convertWeight(suggested.weight ?? 0, suggested.weightUnit ?? unit, unit);
  if (done.reps === suggested.reps && Math.abs(doneW - sugW) < 1e-9) return "same";
  if (repFloor != null && doneW > 0 && sugW > 0) {
    // Unit conversion rounds to 0.1, so treat a smaller gap as the same weight.
    const sameWeight = Math.abs(doneW - sugW) < 0.051;
    if (sameWeight) {
      if (done.reps === suggested.reps) return "same";
      return done.reps > suggested.reps ? "above" : "below";
    }
    if (doneW > sugW && done.reps >= repFloor) return "above";
    if (doneW < sugW) {
      const gain =
        (estimatedOneRepMax(doneW, done.reps) - estimatedOneRepMax(sugW, suggested.reps)) /
        estimatedOneRepMax(sugW, suggested.reps);
      return gain > SAME_TOLERANCE ? "above" : "below";
    }
  }
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

/** A set from the exercise history API. */
interface HistoryRepSet {
  reps: number;
  weight: number | string;
  side?: string | null;
  is_warmup?: boolean;
  duration_seconds?: number | null;
}

/**
 * The bottom of his rep range for an exercise: the lowest working reps over the last few
 * sessions (history oldest first), warmups left out. 6 without history.
 */
export function repFloorFromHistory(
  history: readonly { sets: readonly HistoryRepSet[] }[],
  sessions = 3,
  fallback = 6,
): number {
  let floor = Infinity;
  for (const session of history.slice(-sessions)) {
    const sets: StoredSet[] = session.sets
      .filter((s) => Number(s.reps) > 0 && s.duration_seconds == null)
      .map((s, i) => ({
        id: String(i),
        reps: Number(s.reps),
        weight: Number(s.weight),
        weightUnit: "kg",
        createdAt: "",
        side: (s.side as "L" | "R" | null) ?? undefined,
        ...(s.is_warmup ? { warmup: true } : {}),
      }));
    for (const mode of [sets.filter((s) => s.side == null), sets.filter((s) => s.side != null)]) {
      for (const s of splitSession(mode).working) floor = Math.min(floor, s.reps ?? Infinity);
    }
  }
  return Number.isFinite(floor) ? floor : fallback;
}
