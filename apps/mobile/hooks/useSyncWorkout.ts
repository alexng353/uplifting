import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

interface SyncWorkoutRequest {
  name?: string;
  start_time: string;
  end_time: string;
  privacy?: string;
  gym_location?: string;
  kind?: string;
  exercises: {
    exercise_id: string;
    profile_id?: string;
    sets: {
      reps: number;
      weight: number;
      weight_unit: string;
      created_at?: string;
      side?: string;
      bodyweight?: number;
    }[];
  }[];
}

export function useSyncWorkout() {
  return useMutation({
    mutationFn: async (body: SyncWorkoutRequest) => {
      const { data, error } = await api.api.v1.sync.workout.post(body as any);
      if (error || !data) {
        throw new Error("Failed to sync workout");
      }
      return data as any;
    },
    retry: false, // Don't auto-retry - we handle retries manually
  });
}
