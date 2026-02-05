import { useQuery, useQueryClient } from "@tanstack/react-query";
import Fuse, { type IFuseOptions } from "fuse.js";
import { useEffect, useMemo } from "react";
import { api } from "../lib/api";
import type { Exercise } from "../lib/api-openapi-gen";
import {
	getExercises as getCachedExercises,
	setExercises as setCachedExercises,
} from "../services/local-storage";

// Cache key for all exercises
const ALL_EXERCISES_KEY = ["exercises"] as const;

// Fuse.js options for fuzzy search
const fuseOptions: IFuseOptions<Exercise> = {
	keys: ["name"],
	threshold: 0.4, // Lower = stricter matching
	ignoreLocation: true, // Match anywhere in the string
	includeScore: true,
};

export function useExercises(search?: string) {
	const queryClient = useQueryClient();

	// On mount, load cached exercises into query cache
	useEffect(() => {
		const loadCached = async () => {
			const cached = await getCachedExercises();
			if (cached.length > 0) {
				// Transform cached data back to Exercise type
				const exercises: Exercise[] = cached.map((e) => ({
					id: e.id,
					name: e.name,
					exercise_type: e.exerciseType as Exercise["exercise_type"],
					official: e.official,
					author_id: null,
					description: null,
					created_at: "",
				}));
				queryClient.setQueryData(ALL_EXERCISES_KEY, exercises);
			}
		};
		loadCached();
	}, [queryClient]);

	// Always fetch all exercises (no server-side search)
	const allExercisesQuery = useQuery({
		queryKey: ALL_EXERCISES_KEY,
		queryFn: async () => {
			const { data, error } = await api.listExercises({
				query: { limit: 500 },
			});
			if (error || !data) {
				throw new Error("Failed to fetch exercises");
			}

			// Cache all exercises to IndexedDB
			const toCache = data.exercises.map((e) => ({
				id: e.id,
				name: e.name,
				exerciseType: e.exercise_type,
				official: e.official,
				primaryMuscles: [],
				secondaryMuscles: [],
			}));
			setCachedExercises(toCache);

			return data.exercises;
		},
		staleTime: 1000 * 60 * 60, // 1 hour - exercises don't change often
		gcTime: 1000 * 60 * 60 * 24, // 24 hours in cache
	});

	// Create Fuse instance for fuzzy search
	const fuse = useMemo(() => {
		if (!allExercisesQuery.data) return null;
		return new Fuse(allExercisesQuery.data, fuseOptions);
	}, [allExercisesQuery.data]);

	// Filter exercises client-side using fuzzy search
	const filteredExercises = useMemo(() => {
		if (!allExercisesQuery.data) return undefined;
		if (!search?.trim()) return allExercisesQuery.data;
		if (!fuse) return allExercisesQuery.data;

		const results = fuse.search(search.trim());
		return results.map((r) => r.item);
	}, [allExercisesQuery.data, search, fuse]);

	return {
		...allExercisesQuery,
		data: filteredExercises,
	};
}
