import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function usePendingFriendRequests() {
  return useQuery({
    queryKey: ["pendingFriendRequests"],
    queryFn: async () => {
      const { data, error } = await api.api.v1.friends.requests.get();
      if (error || !data) {
        throw new Error("Failed to fetch pending friend requests");
      }
      return data;
    },
  });
}
