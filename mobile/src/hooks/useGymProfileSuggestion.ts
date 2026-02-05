import { useCallback, useEffect, useState } from "react";
import {
	type GymProfileMapping,
	getCurrentGymId,
	getGymProfileMap,
	setGymProfileForExercise,
} from "../services/local-storage";
import { useAuth } from "./useAuth";
import {
	useServerGymProfileMappings,
	useSetServerGymProfileMapping,
} from "./useServerGyms";

export function useGymProfileSuggestion() {
	const { isAuthenticated } = useAuth();
	const [currentGymId, setCurrentGymId] = useState<string | null>(null);
	const [profileMap, setProfileMap] = useState<GymProfileMapping>({});

	const { data: serverMappings } = useServerGymProfileMappings(
		currentGymId,
		isAuthenticated,
	);
	const setServerMapping = useSetServerGymProfileMapping();

	// Load from local storage on mount
	useEffect(() => {
		Promise.all([getCurrentGymId(), getGymProfileMap()]).then(
			([gymId, map]) => {
				setCurrentGymId(gymId);
				setProfileMap(map);
			},
		);
	}, []);

	// Sync with server mappings when authenticated
	useEffect(() => {
		if (!serverMappings || !currentGymId) return;
		setProfileMap((prevMap) => {
			const newMap: GymProfileMapping = { ...prevMap };
			for (const mapping of serverMappings) {
				const key = `${mapping.exercise_id}_${currentGymId}`;
				newMap[key] = mapping.profile_id;
			}
			return newMap;
		});
	}, [serverMappings, currentGymId]);

	// Re-fetch current gym id when it might have changed
	useEffect(() => {
		const interval = setInterval(() => {
			getCurrentGymId().then(setCurrentGymId);
		}, 1000);
		return () => clearInterval(interval);
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
	};
}
