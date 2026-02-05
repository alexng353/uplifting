import { useCallback, useEffect, useState } from "react";
import {
	getCurrentGymId,
	getGyms,
	type StoredGym,
	setCurrentGymId as setCurrentGymIdStorage,
} from "../services/local-storage";
import { useAuth } from "./useAuth";
import { useServerSettings, useUpdateSettings } from "./useServerSettings";

export function useCurrentGym() {
	const { isAuthenticated } = useAuth();
	const [currentGymId, setCurrentGymIdState] = useState<string | null>(null);
	const [currentGym, setCurrentGym] = useState<StoredGym | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const { data: serverSettings } = useServerSettings(isAuthenticated);
	const updateSettingsMutation = useUpdateSettings();

	// Load from local storage on mount
	useEffect(() => {
		Promise.all([getCurrentGymId(), getGyms()]).then(([gymId, gyms]) => {
			setCurrentGymIdState(gymId);
			if (gymId) {
				const gym = gyms.find((g) => g.id === gymId) ?? null;
				setCurrentGym(gym);
			}
			setIsLoading(false);
		});
	}, []);

	// Sync with server settings when authenticated
	useEffect(() => {
		if (!serverSettings) return;
		const serverGymId = serverSettings.current_gym_id ?? null;
		setCurrentGymIdState(serverGymId);
		setCurrentGymIdStorage(serverGymId);
		if (serverGymId) {
			getGyms().then((gyms) => {
				const gym = gyms.find((g) => g.id === serverGymId) ?? null;
				setCurrentGym(gym);
			});
		} else {
			setCurrentGym(null);
		}
	}, [serverSettings]);

	const setCurrentGymId = useCallback(
		async (gymId: string | null): Promise<void> => {
			// Update locally first
			await setCurrentGymIdStorage(gymId);
			setCurrentGymIdState(gymId);
			if (gymId) {
				const gyms = await getGyms();
				const gym = gyms.find((g) => g.id === gymId) ?? null;
				setCurrentGym(gym);
			} else {
				setCurrentGym(null);
			}

			// Sync to server if authenticated
			if (isAuthenticated) {
				updateSettingsMutation.mutate({
					currentGymId: gymId,
				});
			}
		},
		[isAuthenticated, updateSettingsMutation],
	);

	const refreshCurrentGym = useCallback(async () => {
		const gyms = await getGyms();
		if (currentGymId) {
			const gym = gyms.find((g) => g.id === currentGymId) ?? null;
			setCurrentGym(gym);
			if (!gym) {
				setCurrentGymIdState(null);
				await setCurrentGymIdStorage(null);
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
