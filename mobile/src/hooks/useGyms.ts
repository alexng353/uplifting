import { useCallback, useEffect, useState } from "react";
import {
	addGym as addGymStorage,
	deleteGym as deleteGymStorage,
	getGyms,
	type StoredGym,
	setGyms as setGymsStorage,
	updateGym as updateGymStorage,
} from "../services/local-storage";
import { useAuth } from "./useAuth";
import {
	useCreateServerGym,
	useDeleteServerGym,
	useServerGyms,
	useUpdateServerGym,
} from "./useServerGyms";

export function useGyms() {
	const { isAuthenticated } = useAuth();
	const [gyms, setGyms] = useState<StoredGym[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const { data: serverGyms } = useServerGyms(isAuthenticated);
	const createServerGym = useCreateServerGym();
	const updateServerGym = useUpdateServerGym();
	const deleteServerGym = useDeleteServerGym();

	// Load from local storage on mount
	useEffect(() => {
		getGyms().then((stored) => {
			setGyms(stored);
			setIsLoading(false);
		});
	}, []);

	// Sync with server when authenticated
	useEffect(() => {
		if (!serverGyms) return;
		const newGyms: StoredGym[] = serverGyms.map((g) => ({
			id: g.id,
			name: g.name,
			createdAt: g.created_at,
		}));
		setGyms(newGyms);
		setGymsStorage(newGyms);
	}, [serverGyms]);

	const addGym = useCallback(
		async (name: string): Promise<StoredGym> => {
			// Create locally first
			const newGym = await addGymStorage(name);
			setGyms((prev) => [...prev, newGym]);

			// Sync to server if authenticated
			if (isAuthenticated) {
				try {
					const serverGym = await createServerGym.mutateAsync(name);
					// Update local with server ID
					const updatedGym: StoredGym = {
						id: serverGym.id,
						name: serverGym.name,
						createdAt: serverGym.created_at,
					};
					await deleteGymStorage(newGym.id);
					await addGymStorage(updatedGym.name);
					// Re-sync will happen via serverGyms effect
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
			// Update locally first
			await updateGymStorage(id, name);
			setGyms((prev) => prev.map((g) => (g.id === id ? { ...g, name } : g)));

			// Sync to server if authenticated
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
			// Delete locally first
			await deleteGymStorage(id);
			setGyms((prev) => prev.filter((g) => g.id !== id));

			// Sync to server if authenticated
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
