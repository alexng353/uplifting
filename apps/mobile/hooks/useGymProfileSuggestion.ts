import { useCallback, useEffect, useState } from "react";
import {
  type GymProfileMapping,
  getCurrentGymId,
  getGymProfileMap,
  setGymProfileForExercise,
} from "../services/storage";
import { useAuth } from "./useAuth";
import { useSetServerGymProfileMapping } from "./useServerGyms";

export function useGymProfileSuggestion() {
  const { isAuthenticated } = useAuth();
  const [currentGymId, setCurrentGymIdState] = useState<string | null>(() => getCurrentGymId());
  const [profileMap, setProfileMap] = useState<GymProfileMapping>(() => getGymProfileMap());

  const setServerMapping = useSetServerGymProfileMapping();

  const refreshCurrentGymId = useCallback(() => {
    const gymId = getCurrentGymId();
    setCurrentGymIdState(gymId);
    return gymId;
  }, []);

  const getSuggestedProfile = useCallback(
    (exerciseId: string): string | null => {
      if (!currentGymId || !exerciseId) return null;
      const key = `${exerciseId}_${currentGymId}`;
      return profileMap[key] ?? null;
    },
    [currentGymId, profileMap],
  );

  const recordProfileUsage = useCallback(
    async (exerciseId: string, profileId: string): Promise<void> => {
      const gymId = getCurrentGymId();
      if (!gymId) return;

      // Update locally first
      setGymProfileForExercise(exerciseId, gymId, profileId);
      const key = `${exerciseId}_${gymId}`;
      setProfileMap((prev) => ({ ...prev, [key]: profileId }));

      // Sync to server if authenticated
      if (isAuthenticated) {
        try {
          await setServerMapping.mutateAsync({
            gymId,
            exerciseId,
            profileId,
          });
        } catch {
          // Keep local version if server fails
        }
      }
    },
    [isAuthenticated, setServerMapping],
  );

  return {
    currentGymId,
    getSuggestedProfile,
    recordProfileUsage,
    refreshCurrentGymId,
  };
}
