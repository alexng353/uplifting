import { useCallback, useMemo } from "react";
import { getPreviousSets } from "../services/storage";
import { getPreviousSetSuggestion, type SetSuggestion } from "../lib/previous-sets";

export function usePreviousSets(): {
  isLoading: boolean;
  getSuggestion: (
    exerciseId: string,
    profileId: string | undefined,
    setNumber: number,
    side?: "L" | "R",
  ) => SetSuggestion;
} {
  // The hydrated cache is synchronous, so no loading state is needed.
  const previousSets = useMemo(() => getPreviousSets(), []);

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

  return { isLoading: false, getSuggestion };
}
