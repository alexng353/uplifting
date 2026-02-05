import { useCallback, useEffect, useState } from "react";
import {
	type GymProfileMapping,
	getCurrentGymId,
	getGymProfileMap,
	setGymProfileForExercise,
} from "../services/local-storage";
import { useAuth } from "./useAuth";
import { useSetServerGymProfileMapping } from "./useServerGyms";

export function useGymProfileSuggestion() {
	const { isAuthenticated } = useAuth();
	const [currentGymId, setCurrentGymIdState] = useState<string | null>(null);
	const [profileMap, setProfileMap] = useState<GymProfileMapping>({});

	const setServerMapping = useSetServerGymProfileMapping();

	// Load from local storage on mount (bootstrap has already populated this)
	useEffect(() => {
		Promise.all([getCurrentGymId(), getGymProfileMap()]).then(
			([gymId, map]) => {
				setCurrentGymIdState(gymId);
				setProfileMap(map);
			},
		);
	}, []);

	// Refresh gym ID when called (instead of polling)
	const refreshCurrentGymId = useCallback(async () => {
		const gymId = await getCurrentGymId();
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
			const gymId = await getCurrentGymId();
			if (!gymId) return;

			// Update locally first
			await setGymProfileForExercise(exerciseId, gymId, profileId);
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
