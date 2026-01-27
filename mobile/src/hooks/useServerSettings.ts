import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { StoredSettings } from "../services/local-storage";

export function useServerSettings(enabled = true) {
	return useQuery({
		queryKey: ["settings"],
		queryFn: async () => {
			const { data, error } = await api.getSettings();
			if (error || !data) {
				throw new Error("Failed to fetch settings");
			}
			return data;
		},
		enabled,
	});
}

export function useUpdateSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (settings: StoredSettings) => {
			const { error } = await api.updateSettings({
				body: {
					display_unit: settings.displayUnit,
					max_workout_duration_minutes: settings.maxWorkoutDurationMinutes,
					default_rest_timer_seconds: settings.defaultRestTimerSeconds,
					default_privacy: settings.defaultPrivacy,
					share_gym_location: settings.shareGymLocation,
					share_online_status: settings.shareOnlineStatus,
					share_workout_status: settings.shareWorkoutStatus,
					share_workout_history: settings.shareWorkoutHistory,
				},
			});
			if (error) {
				throw new Error("Failed to update settings");
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["settings"] });
		},
	});
}
