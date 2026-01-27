import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useRespondFriendRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			friendshipId,
			action,
		}: {
			friendshipId: string;
			action: "accept" | "decline" | "block";
		}) => {
			const { data, error } = await api.respondRequest({
				path: { friendship_id: friendshipId },
				body: { action },
			});
			if (error) {
				throw new Error("Failed to respond to friend request");
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pendingFriendRequests"] });
			queryClient.invalidateQueries({ queryKey: ["friends"] });
			queryClient.invalidateQueries({ queryKey: ["feed"] });
		},
	});
}
