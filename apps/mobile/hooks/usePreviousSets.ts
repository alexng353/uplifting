import { useCallback, useMemo } from "react";
import { getPreviousSets, type StoredPreviousSets, type StoredSet } from "../services/storage";

interface SetSuggestion {
  reps: number | null;
  weight: number | null;
  weightUnit: string | null;
}

const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = 20;

export function usePreviousSets(): {
  isLoading: boolean;
  getSuggestion: (
    exerciseId: string,
    profileId: string | undefined,
    setNumber: number,
    side?: "L" | "R",
  ) => SetSuggestion;
} {
  // MMKV is synchronous, so no loading state needed
  const previousSets: StoredPreviousSets = useMemo(() => getPreviousSets(), []);

  const getSuggestion = useCallback(
    (
      exerciseId: string,
      profileId: string | undefined,
      setNumber: number,
      side?: "L" | "R",
    ): SetSuggestion => {
      // Priority 1: Same profile's history for this exercise
      const primaryKey = `${exerciseId}_${profileId ?? "default"}`;
      let sets = previousSets[primaryKey];

      // Priority 2: Fall back to any other profile's history for this exercise
      if (!sets || sets.length === 0) {
        const fallbackKey = Object.keys(previousSets).find(
          (key) => key.startsWith(`${exerciseId}_`) && key !== primaryKey,
        );
        if (fallbackKey) {
          sets = previousSets[fallbackKey];
        }
      }

      // Priority 3: No history found - return defaults
      if (!sets || sets.length === 0) {
        return { reps: DEFAULT_REPS, weight: DEFAULT_WEIGHT, weightUnit: null };
      }

      // Filter by side for unilateral exercises
      let filteredSets: StoredSet[];
      if (side) {
        filteredSets = sets.filter((s) => s.side === side);
        if (filteredSets.length === 0) {
          filteredSets = sets;
        }
      } else {
        filteredSets = sets.filter((s) => !s.side);
        if (filteredSets.length === 0) {
          filteredSets = sets.filter((s) => s.side === "R");
        }
        if (filteredSets.length === 0) {
          filteredSets = sets;
        }
      }

      const index = Math.min(setNumber - 1, filteredSets.length - 1);
      const targetSet = filteredSets[index];

      if (!targetSet) {
        return { reps: DEFAULT_REPS, weight: DEFAULT_WEIGHT, weightUnit: null };
      }

      return {
        reps: targetSet.reps ?? DEFAULT_REPS,
        weight: targetSet.weight ?? DEFAULT_WEIGHT,
        weightUnit: targetSet.weightUnit ?? null,
      };
    },
    [previousSets],
  );

  return { isLoading: false, getSuggestion };
}
