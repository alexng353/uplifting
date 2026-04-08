import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useWorkouts(page = 1, perPage = 10) {
  return useQuery({
    queryKey: ["workouts", page, perPage],
    queryFn: async () => {
      const { data, error } = await api.api.v1.workouts.get({
        query: { page: String(page), per_page: String(perPage) },
      });
      if (error || !data) {
        throw new Error("Failed to fetch workouts");
      }
      return (data as any).workouts;
    },
  });
}
