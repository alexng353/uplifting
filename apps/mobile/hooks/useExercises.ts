import { useQuery, useQueryClient } from "@tanstack/react-query";
import Fuse, { type IFuseOptions } from "fuse.js";
import { useEffect, useMemo } from "react";
import { api } from "../lib/api";
import {
  getExercises as getCachedExercises,
  setExercises as setCachedExercises,
  type StoredExercise,
} from "../services/storage";

// Cache key for all exercises
const ALL_EXERCISES_KEY = ["exercises"] as const;

interface Exercise {
  id: string;
  name: string;
  exercise_type: string;
  official: boolean;
  author_id: string | null;
  description: string | null;
  created_at: string;
  primary_muscles: string[];
  secondary_muscles: string[];
}

// Fuse.js options for fuzzy search
const fuseOptions: IFuseOptions<Exercise> = {
  keys: ["name"],
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: true,
};

export function useExercises(search?: string) {
  const queryClient = useQueryClient();

  // On mount, load cached exercises into query cache
  useEffect(() => {
    const cached = getCachedExercises();
    if (cached.length > 0) {
      const exercises: Exercise[] = cached.map((e) => ({
        id: e.id,
        name: e.name,
        exercise_type: e.exerciseType,
        official: e.official,
        author_id: null,
        description: null,
        created_at: "",
        primary_muscles: e.primaryMuscles,
        secondary_muscles: e.secondaryMuscles,
      }));
      queryClient.setQueryData(ALL_EXERCISES_KEY, exercises);
    }
  }, [queryClient]);

  // Always fetch all exercises (no server-side search)
  const allExercisesQuery = useQuery({
    queryKey: ALL_EXERCISES_KEY,
    queryFn: async () => {
      const { data, error } = await api.api.v1.exercises.get({
        query: { limit: "500" },
      });
      if (error || !data) {
        throw new Error("Failed to fetch exercises");
      }

      const exercises = data as Exercise[];

      // Cache all exercises to MMKV
      const toCache: StoredExercise[] = exercises.map((e) => ({
        id: e.id,
        name: e.name,
        exerciseType: e.exercise_type,
        official: e.official,
        primaryMuscles: e.primary_muscles ?? [],
        secondaryMuscles: e.secondary_muscles ?? [],
      }));
      setCachedExercises(toCache);

      return exercises;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
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
