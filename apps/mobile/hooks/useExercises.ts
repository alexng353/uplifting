import { useQuery, useQueryClient } from "@tanstack/react-query";
import Fuse, { type IFuseOptions } from "fuse.js";
import { useEffect, useMemo } from "react";
import { api, unwrap } from "../lib/api";
import { EXERCISE_SEARCH_ALIASES, scoreExercise } from "../lib/search-constants";
import {
  getExercises as getCachedExercises,
  setExercises as setCachedExercises,
  type StoredExercise,
} from "../services/storage";

// Cache key for all exercises
const ALL_EXERCISES_KEY = ["exercises"] as const;

export interface Exercise {
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
      const exercises = unwrap(
        await api.api.v1.exercises.get({
          query: { limit: "500" },
        }),
      );

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

  // Filter + rank exercises client-side.
  //
  // Fuse provides fuzzy recall; we then re-rank with `scoreExercise` so that
  // exact word matches, exact-order phrases, and alias hits rise to the top
  // (Fuse's own relevance score is only used to break ties). Without this the
  // list was being re-sorted alphabetically by the caller, discarding all
  // relevance.
  const filteredExercises = useMemo(() => {
    if (!allExercisesQuery.data) return undefined;
    const query = search?.trim();
    if (!query) return allExercisesQuery.data;
    if (!fuse) return allExercisesQuery.data;

    // Fuzzy recall, keyed by id so we can dedupe against alias inserts.
    const candidates = new Map<string, { item: Exercise; fuse: number }>();
    for (const r of fuse.search(query)) {
      candidates.set(r.item.id, { item: r.item, fuse: r.score ?? 1 });
    }

    // Make sure alias targets are present even when fuzzy search missed them
    // (e.g. "b" -> "bench press").
    const aliasTargets = EXERCISE_SEARCH_ALIASES[query.toLowerCase()];
    if (aliasTargets) {
      for (const ex of allExercisesQuery.data) {
        const name = ex.name.toLowerCase();
        if (!candidates.has(ex.id) && aliasTargets.some((t) => name.includes(t.toLowerCase()))) {
          candidates.set(ex.id, { item: ex, fuse: 1 });
        }
      }
    }

    return [...candidates.values()]
      .map((c) => ({ ...c, custom: scoreExercise(c.item.name, query) }))
      .sort((a, b) => {
        if (b.custom !== a.custom) return b.custom - a.custom; // higher score first
        if (a.fuse !== b.fuse) return a.fuse - b.fuse; // better fuzzy match first
        return a.item.name.localeCompare(b.item.name);
      })
      .map((c) => c.item);
  }, [allExercisesQuery.data, search, fuse]);

  return {
    ...allExercisesQuery,
    data: filteredExercises,
  };
}
