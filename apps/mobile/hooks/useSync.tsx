import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  getLastSyncTime,
  getPendingWorkout,
  getTodayRestDay,
  setTodayRestDay,
  type StoredWorkout,
  setLastSyncTime,
  setPendingWorkout,
  updatePreviousSets,
  generateId,
} from "../services/storage";
import { api } from "../lib/api";
import { useSyncedSave } from "./useSyncedSave";
import { useSyncWorkout } from "./useSyncWorkout";

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

/**
 * Hook for syncing workouts to the server.
 * Uses the generic useSyncedSave hook with workout-specific configuration.
 */
export function useSync() {
  const queryClient = useQueryClient();
  const syncWorkoutMutation = useSyncWorkout();

  const syncRemote = useCallback(
    async (data: SyncWorkoutRequest) => {
      const result = await syncWorkoutMutation.mutateAsync(data);
      return result;
    },
    [syncWorkoutMutation],
  );

  // Transform local workout to remote format
  const toRemote = useCallback(
    (local: StoredWorkout): SyncWorkoutRequest => ({
      name: local.name,
      start_time: local.startTime,
      end_time: local.endTime ?? new Date().toISOString(),
      privacy: local.privacy,
      gym_location: local.gymLocation,
      kind: local.kind,
      exercises: local.exercises.map((e) => ({
        exercise_id: e.exerciseId,
        profile_id: e.profileId,
        sets: e.sets
          .filter((s) => s.reps != null && s.reps > 0)
          .map((s) => ({
            reps: s.reps ?? 1,
            weight: s.weight ?? 0,
            weight_unit: s.weightUnit,
            created_at: s.createdAt,
            side: s.side,
            bodyweight: s.bodyweight,
          })),
      })),
    }),
    [],
  );

  // Handle successful sync - update previous sets cache
  const onSyncSuccess = useCallback(
    async (response: any, localData: StoredWorkout) => {
      // Handle rest day sync completion
      if (localData.kind === "rest") {
        const currentRestDay = getTodayRestDay();
        if (currentRestDay) {
          // Rest day still active — save the synced server ID
          setTodayRestDay({
            ...currentRestDay,
            syncedWorkoutId: response.workout_id,
          });
        } else {
          // User cancelled while sync was in-flight — delete from server
          try {
            await api.api.v1.workouts({ workoutId: response.workout_id }).delete();
          } catch {
            // Best-effort cleanup
          }
        }
      }

      if (response.previous_sets) {
        for (const [key, sets] of Object.entries(response.previous_sets)) {
          const parts = key.split("_");
          const exerciseId = parts[0];
          const profileId = parts.slice(1).join("_");
          updatePreviousSets(
            exerciseId,
            profileId === "default" ? null : profileId,
            sets.map((s) => ({
              id: generateId(),
              reps: s.reps,
              weight: Number(s.weight),
              weightUnit: s.weight_unit ?? s.weightUnit,
              createdAt: new Date().toISOString(),
              side: s.side as "L" | "R" | undefined,
            })),
          );
        }
      }
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      queryClient.invalidateQueries({ queryKey: ["all-time-stats"] });
    },
    [queryClient],
  );

  const result = useSyncedSave({
    getPending: getPendingWorkout,
    saveLocal: (data: StoredWorkout) => {
      setPendingWorkout(data);
    },
    clearPending: () => {
      setPendingWorkout(null);
    },
    toRemote,
    syncRemote,
    onSyncSuccess,
    getLastSyncTime,
    setLastSyncTime,
  });

  return useMemo(
    () => ({
      isSyncing: result.isSyncing,
      lastSyncTime: result.lastSyncTime,
      hasPendingWorkout: result.hasPending,
      error: result.error,
      retryCount: result.retryCount,
      nextRetryAt: result.nextRetryAt,
      isOnline: result.isOnline,
      forceSync: result.forceSync,
    }),
    [result],
  );
}
