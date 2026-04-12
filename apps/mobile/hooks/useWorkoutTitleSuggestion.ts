import { useMemo } from "react";
import {
  type ExerciseSequenceEntry,
  getExerciseSequences,
  type StoredExerciseSequences,
} from "../services/storage";
import { useWorkout } from "./useWorkout";

/**
 * Returns a suggested workout title based on Jaccard similarity between
 * the current workout's exercises and past titled workouts.
 */
export function useWorkoutTitleSuggestion(): string | undefined {
  const { workout } = useWorkout();

  // MMKV is synchronous
  const sequences = useMemo(() => getExerciseSequences(), []);

  const currentExerciseIds = useMemo(
    () => workout?.exercises.map((e) => e.exerciseId) ?? [],
    [workout?.exercises],
  );

  return useMemo(
    () => suggestWorkoutTitle(sequences, currentExerciseIds),
    [sequences, currentExerciseIds],
  );
}

/**
 * Pure scoring function: given historical sequences (with titles) and current
 * exercise IDs, return the title of the most similar past workout.
 */
export function suggestWorkoutTitle(
  sequences: ExerciseSequenceEntry[],
  currentExerciseIds: string[],
  minSimilarity = 0.5,
): string | undefined {
  if (currentExerciseIds.length === 0 || sequences.length === 0) return undefined;

  const currentSet = new Set(currentExerciseIds);
  let bestTitle: string | undefined;
  let bestScore = 0;

  for (const entry of sequences) {
    if (!entry.title) continue;

    const histSet = new Set(entry.exerciseIds);
    let intersectionSize = 0;
    for (const id of currentSet) {
      if (histSet.has(id)) intersectionSize++;
    }
    const unionSize = new Set([...currentSet, ...histSet]).size;
    const jaccard = intersectionSize / unionSize;

    if (jaccard > bestScore) {
      bestScore = jaccard;
      bestTitle = entry.title;
    }
  }

  return bestScore >= minSimilarity ? bestTitle : undefined;
}
