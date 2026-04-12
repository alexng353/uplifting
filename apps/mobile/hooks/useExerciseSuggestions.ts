import { useMemo } from "react";
import { getExerciseSequences, type StoredExerciseSequences } from "../services/storage";
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

  return useMemo(
    () => rankExercises(sequences, currentExerciseIds, maxSuggestions),
    [sequences, currentExerciseIds, maxSuggestions],
  );
}

/**
 * Pure scoring function: given historical sequences and current exercise IDs,
 * return ranked suggested exercise IDs.
 */
export function rankExercises(
  sequences: StoredExerciseSequences,
  currentExerciseIds: string[],
  maxSuggestions = 5,
): string[] {
  if (sequences.length === 0) return [];

  const currentSet = new Set(currentExerciseIds);
  const scores = new Map<string, number>();

  for (let i = 0; i < sequences.length; i++) {
    const entry = sequences[i];
    const exerciseIds = entry.exerciseIds;
    const recencyWeight = 0.85 ** i;

    if (currentSet.size === 0) {
      const firstExercise = exerciseIds[0];
      if (firstExercise) {
        scores.set(firstExercise, (scores.get(firstExercise) ?? 0) + recencyWeight);
      }
      continue;
    }

    const lastCurrentIdx = findLastMatchIndex(exerciseIds, currentSet);

    if (lastCurrentIdx === -1) continue;

    for (let j = lastCurrentIdx + 1; j < exerciseIds.length; j++) {
      const candidateId = exerciseIds[j];
      if (currentSet.has(candidateId)) continue;

      const positionWeight = 1 / (j - lastCurrentIdx);
      const totalWeight = recencyWeight * positionWeight;

      scores.set(candidateId, (scores.get(candidateId) ?? 0) + totalWeight);
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSuggestions)
    .map(([id]) => id);
}

function findLastMatchIndex(sequence: string[], currentIds: Set<string>): number {
  let lastIdx = -1;
  for (let i = 0; i < sequence.length; i++) {
    if (currentIds.has(sequence[i])) {
      lastIdx = i;
    }
  }
  return lastIdx;
}
