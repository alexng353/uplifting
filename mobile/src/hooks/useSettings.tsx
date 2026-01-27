import { useCallback, useEffect, useState } from "react";
import {
	convertWeight,
	DEFAULT_SETTINGS,
	getSettings,
	type StoredSettings,
	setSettings as saveSettings,
} from "../services/local-storage";
import { useAuth } from "./useAuth";
import { useServerSettings, useUpdateSettings } from "./useServerSettings";

export function useSettings() {
	const { isAuthenticated } = useAuth();
	const [settings, setSettingsState] =
		useState<StoredSettings>(DEFAULT_SETTINGS);
	const [isLoading, setIsLoading] = useState(true);

	const { data: serverSettings } = useServerSettings(isAuthenticated);
	const updateSettingsMutation = useUpdateSettings();

	// Load settings from local storage on mount
	useEffect(() => {
		getSettings().then((stored) => {
			setSettingsState(stored);
			setIsLoading(false);
		});
	}, []);

	// Sync with server when authenticated
	useEffect(() => {
		if (!serverSettings) return;
		const newSettings: StoredSettings = {
			displayUnit: serverSettings.display_unit as "kg" | "lbs" | null,
			maxWorkoutDurationMinutes: serverSettings.max_workout_duration_minutes,
			defaultRestTimerSeconds: serverSettings.default_rest_timer_seconds,
			defaultPrivacy: serverSettings.default_privacy,
			shareGymLocation: serverSettings.share_gym_location,
			shareOnlineStatus: serverSettings.share_online_status,
			shareWorkoutStatus: serverSettings.share_workout_status,
			shareWorkoutHistory: serverSettings.share_workout_history,
		};
		setSettingsState(newSettings);
		saveSettings(newSettings);
	}, [serverSettings]);

	const updateSettings = useCallback(
		async (updates: Partial<StoredSettings>) => {
			const newSettings = { ...settings, ...updates };
			setSettingsState(newSettings);
			await saveSettings(newSettings);

			// Sync to server if online
			if (isAuthenticated) {
				updateSettingsMutation.mutate(newSettings);
			}
		},
		[settings, isAuthenticated, updateSettingsMutation],
	);

	// Get display unit (auto-detect from locale if not set)
	const getDisplayUnit = useCallback((): "kg" | "lbs" => {
		if (settings.displayUnit) return settings.displayUnit;
		// Auto-detect: US uses lbs, rest of world uses kg
		const locale = navigator.language;
		return locale.startsWith("en-US") ? "lbs" : "kg";
	}, [settings.displayUnit]);

	// Format weight for display
	const formatWeight = useCallback(
		(weight: number, unit: string): string => {
			const displayUnit = getDisplayUnit();
			const converted = convertWeight(weight, unit, displayUnit);
			return `${converted} ${displayUnit}`;
		},
		[getDisplayUnit],
	);

	return {
		settings,
		isLoading,
		updateSettings,
		getDisplayUnit,
		formatWeight,
	};
}
