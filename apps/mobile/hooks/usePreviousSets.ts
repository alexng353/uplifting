import { useCallback, useMemo } from "react";
import { getPreviousSets, getSetCounts } from "../services/storage";
import {
  getPreviousSetSuggestion,
  lastWarmupCount,
  type SetSuggestion,
} from "../lib/previous-sets";
import { targetSetCount } from "../lib/target-sets";
import { previousFor } from "../lib/warmup-apply";
import type { StoredSet } from "../services/storage";

export function usePreviousSets(): {
  isLoading: boolean;
  getSuggestion: (
    exerciseId: string,
    profileId: string | undefined,
    setNumber: number,
    side?: "L" | "R",
    opts?: { warmup?: boolean },
  ) => SetSuggestion;
  getWarmupCount: (exerciseId: string, profileId: string | undefined, side?: "L" | "R") => number;
  getTargetSetCount: (exerciseId: string, profileId?: string) => number | null;
  getPrevious: (exerciseId: string, profileId?: string) => StoredSet[];
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
      opts?: { warmup?: boolean },
    ): SetSuggestion =>
      getPreviousSetSuggestion(previousSets, exerciseId, profileId, setNumber, side, opts),
    [previousSets],
  );

  const getWarmupCount = useCallback(
    (exerciseId: string, profileId: string | undefined, side?: "L" | "R") =>
      lastWarmupCount(previousSets, exerciseId, profileId, side),
    [previousSets],
  );

  const getTargetSetCount = useCallback(
    (exerciseId: string, profileId?: string) =>
      targetSetCount(setCounts, previousSets, exerciseId, profileId),
    [setCounts, previousSets],
  );

  const getPrevious = useCallback(
    (exerciseId: string, profileId?: string) => previousFor(previousSets, exerciseId, profileId),
    [previousSets],
  );

  return { isLoading: false, getSuggestion, getWarmupCount, getTargetSetCount, getPrevious };
}
