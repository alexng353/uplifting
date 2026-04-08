import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data, error } = await api.api.v1.users.me.get();
      if (error || !data) {
        throw new Error("Failed to fetch user profile");
      }
      return data;
    },
    enabled,
  });
}
