import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import { useAuth } from "./useAuth";

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      return unwrap(await api.api.v1.users.me.get());
    },
    enabled: isAuthenticated,
  });
}
