import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "../lib/api";
import type { Exercise } from "../lib/api-openapi-gen";
import {
	getExercises as getCachedExercises,
	setExercises as setCachedExercises,
} from "../services/local-storage";

// Cache key for all exercises (no search filter)
const ALL_EXERCISES_KEY = ["exercises", ""] as const;

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

	return useQuery({
		queryKey: ["exercises", search ?? ""],
		queryFn: async () => {
			const { data, error } = await api.listExercises({
				query: { search: search || undefined, limit: 500 },
			});
			if (error || !data) {
				throw new Error("Failed to fetch exercises");
			}

			// Cache all exercises (when no search filter) to IndexedDB
			if (!search) {
				const toCache = data.exercises.map((e) => ({
					id: e.id,
					name: e.name,
					exerciseType: e.exercise_type,
					official: e.official,
					primaryMuscles: [],
					secondaryMuscles: [],
				}));
				setCachedExercises(toCache);
			}

			return data.exercises;
		},
		staleTime: 1000 * 60 * 60, // 1 hour - exercises don't change often
		gcTime: 1000 * 60 * 60 * 24, // 24 hours in cache
	});
}
