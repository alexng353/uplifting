import { useCallback, useEffect, useState } from "react";
import {
  getCurrentGymId,
  getGyms,
  type StoredGym,
  setCurrentGymId as setCurrentGymIdStorage,
} from "../services/storage";
import { useAuth } from "./useAuth";
import { useServerSettings, useUpdateSettings } from "./useServerSettings";

export function useCurrentGym() {
  const { isAuthenticated } = useAuth();
  const [currentGymId, setCurrentGymIdState] = useState<string | null>(() =>
    getCurrentGymId(),
  );
  const [currentGym, setCurrentGym] = useState<StoredGym | null>(() => {
    const gymId = getCurrentGymId();
    if (!gymId) return null;
    const gyms = getGyms();
    return gyms.find((g) => g.id === gymId) ?? null;
  });
  const [isLoading] = useState(false);

  const { data: serverSettings } = useServerSettings(isAuthenticated);
  const updateSettingsMutation = useUpdateSettings();

  // Sync with server settings when authenticated
  useEffect(() => {
    if (!serverSettings) return;
    const serverGymId = serverSettings.currentGymId ?? null;
    setCurrentGymIdState(serverGymId);
    setCurrentGymIdStorage(serverGymId);
    if (serverGymId) {
      const gyms = getGyms();
      const gym = gyms.find((g) => g.id === serverGymId) ?? null;
      setCurrentGym(gym);
    } else {
      setCurrentGym(null);
    }
  }, [serverSettings]);

  const setCurrentGymId = useCallback(
    async (gymId: string | null): Promise<void> => {
      setCurrentGymIdStorage(gymId);
      setCurrentGymIdState(gymId);
      if (gymId) {
        const gyms = getGyms();
        const gym = gyms.find((g) => g.id === gymId) ?? null;
        setCurrentGym(gym);
      } else {
        setCurrentGym(null);
      }

      if (isAuthenticated) {
        updateSettingsMutation.mutate({
          currentGymId: gymId,
        });
      }
    },
    [isAuthenticated, updateSettingsMutation],
  );

  const refreshCurrentGym = useCallback(() => {
    const gyms = getGyms();
    if (currentGymId) {
      const gym = gyms.find((g) => g.id === currentGymId) ?? null;
      setCurrentGym(gym);
      if (!gym) {
        setCurrentGymIdState(null);
        setCurrentGymIdStorage(null);
      }
    }
  }, [currentGymId]);

  return {
    currentGymId,
    currentGym,
    setCurrentGymId,
    refreshCurrentGym,
    isLoading,
  };
}
