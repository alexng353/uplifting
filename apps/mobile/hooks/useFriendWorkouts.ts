import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function useFriendWorkouts(friendId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["friends", friendId, "workouts"],
    queryFn: async () => {
      if (!friendId) return null;
      return unwrap(
        await api.api.v1.friends.workouts({ friendId }).get({
          query: { limit: "20", offset: "0" },
        }),
      );
    },
    enabled: enabled && !!friendId,
  });
}
