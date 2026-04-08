import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useAllTimeStats() {
  return useQuery({
    queryKey: ["all-time-stats"],
    queryFn: async () => {
      const { data, error } = await (
        api.api.v1.workouts as any
      )["all-time-stats"].get();
      if (error || !data) throw new Error("Failed to fetch all-time stats");
      return data;
    },
  });
}
