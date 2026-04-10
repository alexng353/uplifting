import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      return unwrap(await api.api.v1.users.me.get());
    },
    enabled,
  });
}
