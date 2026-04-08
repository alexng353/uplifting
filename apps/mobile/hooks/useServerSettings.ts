import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { StoredSettings } from "../services/storage";

export function useServerSettings(enabled = true) {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await api.api.v1.users.settings.get();
      if (error || !data) {
        throw new Error("Failed to fetch settings");
      }
      return data as any;
    },
    enabled,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<StoredSettings>) => {
      const { error } = await api.api.v1.users.settings.put({
        display_unit: settings.displayUnit ?? undefined,
        max_workout_duration_minutes:
          settings.maxWorkoutDurationMinutes ?? undefined,
        default_rest_timer_seconds:
          settings.defaultRestTimerSeconds ?? undefined,
        default_privacy: settings.defaultPrivacy ?? undefined,
        share_gym_location: settings.shareGymLocation ?? undefined,
        share_online_status: settings.shareOnlineStatus ?? undefined,
        share_workout_status: settings.shareWorkoutStatus ?? undefined,
        share_workout_history: settings.shareWorkoutHistory ?? undefined,
        current_gym_id: settings.currentGymId ?? undefined,
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
