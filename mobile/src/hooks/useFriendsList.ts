import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useFriendsList() {
	return useQuery({
		queryKey: ["friends", "list"],
		queryFn: async () => {
			const { data, error } = await api.listFriends();
			if (error || !data) {
				throw new Error("Failed to fetch friends list");
			}
			return data;
		},
		refetchInterval: 60_000, // Refresh every minute to update status
	});
}
