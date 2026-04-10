import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function useFriendsList() {
  return useQuery({
    queryKey: ["friends", "list"],
    queryFn: async () => {
      return unwrap(await api.api.v1.friends.get());
    },
    refetchInterval: 60_000, // Refresh every minute to update status
  });
}
