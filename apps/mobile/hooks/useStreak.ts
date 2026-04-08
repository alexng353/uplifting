import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

/**
 * Fetch the current consecutive-day streak from the server.
 * A day counts if the user logged a workout or rest day.
 */
export function useStreak() {
  const { data } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      const { data, error } = await api.api.v1.workouts.streak.get();
      if (error || !data) return 0;
      return (data as any).current_streak;
    },
  });

  return data ?? 0;
}
