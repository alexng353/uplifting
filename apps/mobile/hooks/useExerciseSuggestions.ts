import { useMemo } from "react";
import { getDayTypes, getExerciseSequences } from "../services/storage";
import { rankForDay } from "../lib/day-types";
import { rankExercises } from "../lib/exercise-rank";
import { useWorkout } from "./useWorkout";

/**
 * Returns suggested exercise IDs ranked by a weighted frequency analysis
 * of past workout sequences. More recent workouts are weighted higher.
 */
export function useExerciseSuggestions(maxSuggestions = 5): string[] {
  const { workout } = useWorkout();

  // MMKV is synchronous so we can read directly in useMemo
  const sequences = useMemo(() => getExerciseSequences(), []);

  const currentExerciseIds = useMemo(
    () => workout?.exercises.map((e) => e.exerciseId) ?? [],
    [workout?.exercises],
  );

  // With a day picked at Start, its list and its own history come first.
  const day = useMemo(
    () => (workout?.dayTypeId ? getDayTypes()?.find((d) => d.id === workout.dayTypeId) : undefined),
    [workout?.dayTypeId],
  );
  return useMemo(
    () =>
      day
        ? rankForDay(day, sequences, currentExerciseIds, rankExercises, maxSuggestions)
        : rankExercises(sequences, currentExerciseIds, maxSuggestions),
    [day, sequences, currentExerciseIds, maxSuggestions],
  );
}

export { rankExercises };
