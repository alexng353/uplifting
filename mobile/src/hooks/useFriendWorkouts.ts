import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useFriendWorkouts(friendId: string | null, enabled = true) {
	return useQuery({
		queryKey: ["friends", friendId, "workouts"],
		queryFn: async () => {
			if (!friendId) return null;
			const { data, error } = await api.getFriendWorkouts({
				path: { friend_id: friendId },
				query: { limit: 20, offset: 0 },
			});
			if (error || !data) {
				throw new Error("Failed to fetch friend workouts");
			}
			return data;
		},
		enabled: enabled && !!friendId,
	});
}
