import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      const { data, error } = await api.api.v1.users.search.get({
        query: { q: query },
      });
      if (error || !data) {
        throw new Error("Failed to search users");
      }
      return data;
    },
    enabled: query.trim().length > 0,
  });
}
