import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { SyncWorkoutRequest } from "../lib/api-openapi-gen";

export function useSyncWorkout() {
	return useMutation({
		mutationFn: async (body: SyncWorkoutRequest) => {
			const { data, error } = await api.syncWorkout({ body });
			if (error || !data) {
				throw new Error("Failed to sync workout");
			}
			return data;
		},
		retry: false, // Don't auto-retry - we handle retries manually
	});
}
