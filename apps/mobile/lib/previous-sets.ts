import type { StoredPreviousSets, StoredSet } from "../services/storage";

// A null field means the history has no value for it; callers pick their own fallback.
export interface SetSuggestion {
  reps: number | null;
  weight: number | null;
  weightUnit: string | null;
  /** Timed exercises: last time's values for this set. */
  durationSeconds?: number;
  speed?: number;
  speedUnit?: string;
  incline?: number;
}

export function getPreviousSetSuggestion(
  previousSets: StoredPreviousSets,
  exerciseId: string,
  profileId: string | undefined,
  setNumber: number,
  side?: "L" | "R",
): SetSuggestion {
  // Suggestions follow last session's working sets; its warmups have their own rows.
  const matchingMode = (sets: StoredSet[] = []) =>
    sets.filter((set) => (set.side != null) === (side != null) && !set.warmup);

  // Prefer this profile, then another profile with history in the same mode.
  const primaryKey = `${exerciseId}_${profileId ?? "default"}`;
  let sets = matchingMode(previousSets[primaryKey]);
  if (sets.length === 0) {
    for (const [key, history] of Object.entries(previousSets)) {
      if (key.startsWith(`${exerciseId}_`) && key !== primaryKey) {
        sets = matchingMode(history);
        if (sets.length > 0) break;
      }
    }
  }

  // Prefer the requested side, but only fall back within unilateral history.
  if (side) {
    const sideSets = sets.filter((set) => set.side === side);
    if (sideSets.length > 0) sets = sideSets;
  }

  const targetSet = sets[Math.min(setNumber - 1, sets.length - 1)];
  if (!targetSet) return { reps: null, weight: null, weightUnit: null };
  return {
    reps: targetSet.reps ?? null,
    weight: targetSet.weight ?? null,
    weightUnit: targetSet.weightUnit,
    ...(targetSet.durationSeconds != null
      ? {
          durationSeconds: targetSet.durationSeconds,
          speed: targetSet.speed,
          speedUnit: targetSet.speedUnit,
          incline: targetSet.incline,
        }
      : null),
  };
}
