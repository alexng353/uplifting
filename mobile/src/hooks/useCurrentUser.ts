import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "./useAuth";

export function useCurrentUser() {
	const { isAuthenticated } = useAuth();

	return useQuery({
		queryKey: ["currentUser"],
		queryFn: async () => {
			const { data, error } = await api.getMe();
			if (error || !data) {
				throw new Error("Failed to fetch user profile");
			}
			return data;
		},
		enabled: isAuthenticated,
	});
}
