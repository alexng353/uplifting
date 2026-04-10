import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function useWorkouts(page = 1, perPage = 10) {
  return useQuery({
    queryKey: ["workouts", page, perPage],
    queryFn: async () => {
      const data = unwrap(
        await api.api.v1.workouts.get({
          query: { page: String(page), per_page: String(perPage) },
        }),
      );
      return data.workouts;
    },
  });
}
