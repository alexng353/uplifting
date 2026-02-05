import { useCallback, useEffect, useState } from "react";
import {
	getPreviousSets,
	type StoredPreviousSets,
	type StoredSet,
} from "../services/local-storage";

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
	const [previousSets, setPreviousSets] = useState<StoredPreviousSets | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		getPreviousSets()
			.then((data) => {
				setPreviousSets(data);
				setIsLoading(false);
			})
			.catch(() => {
				setPreviousSets({});
				setIsLoading(false);
			});
	}, []);

	const getSuggestion = useCallback(
		(
			exerciseId: string,
			profileId: string | undefined,
			setNumber: number,
			side?: "L" | "R",
		): SetSuggestion => {
			if (!previousSets) {
				return { reps: DEFAULT_REPS, weight: DEFAULT_WEIGHT, weightUnit: null };
			}

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
				// Fall back to all sets if no matching side found
				if (filteredSets.length === 0) {
					filteredSets = sets;
				}
			} else {
				// For bilateral, filter out sets with sides (if any)
				filteredSets = sets.filter((s) => !s.side);
				// If all sets have sides (previous was unilateral), just use right side
				if (filteredSets.length === 0) {
					filteredSets = sets.filter((s) => s.side === "R");
				}
				// If still nothing, use all sets
				if (filteredSets.length === 0) {
					filteredSets = sets;
				}
			}

			// Get set at setNumber - 1 index, or last set if fewer sets exist
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

	return { isLoading, getSuggestion };
}
