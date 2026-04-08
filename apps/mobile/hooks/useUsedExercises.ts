import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

const PAGE_SIZE = 20;

export function useUsedExercises() {
  return useInfiniteQuery({
    queryKey: ["used-exercises"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await api.api.v1.exercises.used.get({
        query: { offset: String(pageParam), limit: String(PAGE_SIZE) },
      });
      if (error || !data) throw new Error("Failed to fetch used exercises");
      return data as any[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.flat().length;
    },
  });
}
