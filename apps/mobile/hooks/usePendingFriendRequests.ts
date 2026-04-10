import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function usePendingFriendRequests() {
  return useQuery({
    queryKey: ["pendingFriendRequests"],
    queryFn: async () => {
      return unwrap(await api.api.v1.friends.requests.get());
    },
  });
}
