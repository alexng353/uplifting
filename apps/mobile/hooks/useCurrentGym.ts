import { useCallback, useEffect, useState } from "react";
import { serverGymApplies } from "../lib/current-gym";
import {
  getCurrentGymDetectedAt,
  getCurrentGymId,
  getCurrentWorkout,
  getGyms,
  type StoredGym,
  setCurrentGymId as setCurrentGymIdStorage,
  setCurrentGymManualFor,
  subscribeCurrentGym,
} from "../services/storage";
import { useAuth } from "./useAuth";
import { useServerSettings, useUpdateSettings } from "./useServerSettings";

const gymFor = (id: string | null) => (id ? (getGyms().find((g) => g.id === id) ?? null) : null);

export function useCurrentGym() {
  const { isAuthenticated } = useAuth();
  const [currentGymId, setCurrentGymIdState] = useState<string | null>(() => getCurrentGymId());
  const [currentGym, setCurrentGym] = useState<StoredGym | null>(() => gymFor(getCurrentGymId()));
  const [isLoading] = useState(false);

  const { data: serverSettings } = useServerSettings(isAuthenticated);
  const updateSettingsMutation = useUpdateSettings();

  // Follow every change, including location detection while this screen is open.
  useEffect(
    () =>
      subscribeCurrentGym((id) => {
        setCurrentGymIdState(id);
        setCurrentGym(gymFor(id));
      }),
    [],
  );

  // Take the server's gym (another device, a reinstall) unless a fresh detection on this
  // phone hasn't reached the server yet; that stale value made the old gym stick.
  useEffect(() => {
    if (!serverSettings) return;
    const serverGymId = serverSettings.currentGymId ?? null;
    const apply = serverGymApplies({
      serverGymId,
      localGymId: getCurrentGymId(),
      detectedAt: getCurrentGymDetectedAt(),
      now: Date.now(),
    });
    if (apply) setCurrentGymIdStorage(serverGymId);
    const id = getCurrentGymId();
    setCurrentGymIdState(id);
    setCurrentGym(gymFor(id));
  }, [serverSettings]);

  /** A pick by hand. During a workout it holds until Finish, whatever location says. */
  const setCurrentGymId = useCallback(
    async (gymId: string | null): Promise<void> => {
      setCurrentGymManualFor(getCurrentWorkout()?.id ?? null);
      setCurrentGymIdStorage(gymId);
      setCurrentGymIdState(gymId);
      setCurrentGym(gymFor(gymId));

      if (isAuthenticated) {
        updateSettingsMutation.mutate({
          currentGymId: gymId,
        });
      }
    },
    [isAuthenticated, updateSettingsMutation],
  );

  const refreshCurrentGym = useCallback(() => {
    if (currentGymId) {
      const gym = gymFor(currentGymId);
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
