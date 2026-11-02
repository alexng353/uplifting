import { useMutation } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export interface SyncWorkoutRequest {
  name?: string;
  start_time: string;
  end_time: string;
  privacy?: string;
  gym_location?: string;
  kind?: string;
  /** The phone's workout id; gym check-ins carry it too. */
  client_id: string;
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
      return unwrap(await api.api.v1.sync.workout.post(body));
    },
    retry: false, // Don't auto-retry - we handle retries manually
  });
}
