import { useCallback, useMemo } from "react";
import { getPreviousSets, getSetCounts } from "../services/storage";
import { getPreviousSetSuggestion, type SetSuggestion } from "../lib/previous-sets";
import { targetSetCount } from "../lib/target-sets";

export function usePreviousSets(): {
  isLoading: boolean;
  getSuggestion: (
    exerciseId: string,
    profileId: string | undefined,
    setNumber: number,
    side?: "L" | "R",
  ) => SetSuggestion;
  getTargetSetCount: (exerciseId: string) => number | null;
} {
  // The hydrated cache is synchronous, so no loading state is needed.
  const previousSets = useMemo(() => getPreviousSets(), []);
  const setCounts = useMemo(() => getSetCounts(), []);

  const getSuggestion = useCallback(
    (
      exerciseId: string,
      profileId: string | undefined,
      setNumber: number,
      side?: "L" | "R",
    ): SetSuggestion =>
      getPreviousSetSuggestion(previousSets, exerciseId, profileId, setNumber, side),
    [previousSets],
  );

  const getTargetSetCount = useCallback(
    (exerciseId: string) => targetSetCount(setCounts, previousSets, exerciseId),
    [setCounts, previousSets],
  );

  return { isLoading: false, getSuggestion, getTargetSetCount };
}
