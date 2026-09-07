import type { StoredPreviousSets, StoredSet } from "../services/storage";

export interface SetSuggestion {
  reps: number | null;
  weight: number | null;
  weightUnit: string | null;
}

const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = 20;

export function getPreviousSetSuggestion(
  previousSets: StoredPreviousSets,
  exerciseId: string,
  profileId: string | undefined,
  setNumber: number,
  side?: "L" | "R",
): SetSuggestion {
  const matchingMode = (sets: StoredSet[] = []) =>
    sets.filter((set) => (set.side != null) === (side != null));

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
  return {
    reps: targetSet?.reps ?? DEFAULT_REPS,
    weight: targetSet?.weight ?? DEFAULT_WEIGHT,
    weightUnit: targetSet?.weightUnit ?? null,
  };
}
