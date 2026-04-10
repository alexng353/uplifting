import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      return unwrap(
        await api.api.v1.users.search.get({
          query: { q: query },
        }),
      );
    },
    enabled: query.trim().length > 0,
  });
}
