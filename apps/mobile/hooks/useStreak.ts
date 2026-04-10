import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

/**
 * Fetch the current consecutive-day streak from the server.
 * A day counts if the user logged a workout or rest day.
 */
export function useStreak() {
  const { data } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      try {
        const data = unwrap(await api.api.v1.workouts.streak.get());
        return data.current_streak;
      } catch {
        return 0;
      }
    },
  });

  return data ?? 0;
}
