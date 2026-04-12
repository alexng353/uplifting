import { useCallback, useEffect, useState } from "react";
import {
  addGym as addGymStorage,
  deleteGym as deleteGymStorage,
  getGyms,
  type StoredGym,
  setGyms as setGymsStorage,
  updateGym as updateGymStorage,
} from "../services/storage";
import { useAuth } from "./useAuth";
import {
  useCreateServerGym,
  useDeleteServerGym,
  useServerGyms,
  useUpdateServerGym,
} from "./useServerGyms";

export function useGyms() {
  const { isAuthenticated } = useAuth();
  const [gyms, setGyms] = useState<StoredGym[]>(() => getGyms());
  const [isLoading, setIsLoading] = useState(false);

  const { data: serverGyms } = useServerGyms(isAuthenticated);
  const createServerGym = useCreateServerGym();
  const updateServerGym = useUpdateServerGym();
  const deleteServerGym = useDeleteServerGym();

  // Sync with server when authenticated
  useEffect(() => {
    if (!serverGyms) return;
    const newGyms: StoredGym[] = serverGyms.map((g) => ({
      id: g.id,
      name: g.name,
      latitude: g.latitude ?? null,
      longitude: g.longitude ?? null,
      createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : new Date().toISOString(),
    }));
    setGyms(newGyms);
    setGymsStorage(newGyms);
  }, [serverGyms]);

  const addGym = useCallback(
    async (
      name: string,
      latitude?: number | null,
      longitude?: number | null,
    ): Promise<StoredGym> => {
      // Create locally first
      const newGym = addGymStorage(name, latitude, longitude);
      setGyms((prev) => [...prev, newGym]);

      // Sync to server if authenticated
      if (isAuthenticated) {
        try {
          const serverGym = await createServerGym.mutateAsync({
            name,
            latitude: latitude ?? undefined,
            longitude: longitude ?? undefined,
          });
          // Update local with server ID
          const updatedGym: StoredGym = {
            id: serverGym.id,
            name: serverGym.name,
            latitude: serverGym.latitude ?? null,
            longitude: serverGym.longitude ?? null,
            createdAt: serverGym.createdAt
              ? new Date(serverGym.createdAt).toISOString()
              : new Date().toISOString(),
          };
          deleteGymStorage(newGym.id);
          addGymStorage(updatedGym.name, updatedGym.latitude, updatedGym.longitude);
          return updatedGym;
        } catch {
          // Keep local version if server fails
        }
      }
      return newGym;
    },
    [isAuthenticated, createServerGym],
  );

  const updateGym = useCallback(
    async (id: string, name: string): Promise<void> => {
      updateGymStorage(id, name);
      setGyms((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));

      if (isAuthenticated) {
        try {
          await updateServerGym.mutateAsync({ gymId: id, name });
        } catch {
          // Keep local version if server fails
        }
      }
    },
    [isAuthenticated, updateServerGym],
  );

  const deleteGym = useCallback(
    async (id: string): Promise<void> => {
      deleteGymStorage(id);
      setGyms((prev) => prev.filter((g) => g.id !== id));

      if (isAuthenticated) {
        try {
          await deleteServerGym.mutateAsync(id);
        } catch {
          // Local is already deleted
        }
      }
    },
    [isAuthenticated, deleteServerGym],
  );

  return {
    gyms,
    isLoading,
    addGym,
    updateGym,
    deleteGym,
  };
}
