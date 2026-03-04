import { useEffect, useMemo, useState } from "react";
import {
	getExerciseSequences,
	type StoredExerciseSequences,
} from "../services/local-storage";
import { useWorkout } from "./useWorkout";

/**
 * Returns suggested exercise IDs ranked by a weighted frequency analysis
 * of past workout sequences. More recent workouts are weighted higher.
 *
 * The algorithm:
 * 1. Look at all stored exercise sequences (last ~20 workouts)
 * 2. For each sequence, find exercises that appeared after the current
 *    workout's exercises (pattern matching on the tail of the sequence)
 * 3. Weight more recent workouts higher (exponential decay)
 * 4. Return ranked exercise IDs, excluding those already in the workout
 */
export function useExerciseSuggestions(maxSuggestions = 5): string[] {
	const { workout } = useWorkout();
	const [sequences, setSequences] = useState<StoredExerciseSequences>([]);

	useEffect(() => {
		getExerciseSequences().then(setSequences);
	}, []);

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
		const sequence = sequences[i];
		// Recency weight: most recent workout = 1.0, decays by 0.85 per older workout
		const recencyWeight = 0.85 ** i;

		if (currentSet.size === 0) {
			// No exercises yet — suggest based on what exercises commonly start workouts
			const firstExercise = sequence[0];
			if (firstExercise) {
				scores.set(
					firstExercise,
					(scores.get(firstExercise) ?? 0) + recencyWeight,
				);
			}
			continue;
		}

		// Find the best matching position in this historical sequence
		// Strategy: find where the current exercises overlap in this sequence,
		// then suggest what comes next
		const lastCurrentIdx = findLastMatchIndex(sequence, currentSet);

		if (lastCurrentIdx === -1) continue;

		// Suggest exercises that follow the matched position
		for (let j = lastCurrentIdx + 1; j < sequence.length; j++) {
			const candidateId = sequence[j];
			if (currentSet.has(candidateId)) continue;

			// Position weight: immediately next exercise scores highest
			const positionWeight = 1 / (j - lastCurrentIdx);
			const totalWeight = recencyWeight * positionWeight;

			scores.set(candidateId, (scores.get(candidateId) ?? 0) + totalWeight);
		}
	}

	// Sort by score descending and return top N
	return [...scores.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, maxSuggestions)
		.map(([id]) => id);
}

/**
 * Find the index of the last exercise in `sequence` that appears in `currentIds`.
 * This tells us "how far into this historical workout the user currently is".
 */
function findLastMatchIndex(
	sequence: string[],
	currentIds: Set<string>,
): number {
	let lastIdx = -1;
	for (let i = 0; i < sequence.length; i++) {
		if (currentIds.has(sequence[i])) {
			lastIdx = i;
		}
	}
	return lastIdx;
}
