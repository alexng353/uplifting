import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function useAllTimeStats() {
  return useQuery({
    queryKey: ["all-time-stats"],
    queryFn: async () => {
      return unwrap(await api.api.v1.workouts["all-time-stats"].get());
    },
  });
}
