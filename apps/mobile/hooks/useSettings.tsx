import { useCallback, useEffect, useState } from "react";
import { Platform, NativeModules } from "react-native";
import {
  convertWeight,
  DEFAULT_SETTINGS,
  getSettings,
  type StoredSettings,
  setSettings as saveSettings,
} from "../services/storage";
import { useAuth } from "./useAuth";
import { useServerSettings, useUpdateSettings } from "./useServerSettings";

export function useSettings() {
  const { isAuthenticated } = useAuth();
  const [settings, setSettingsState] = useState<StoredSettings>(() => getSettings());
  const [isLoading] = useState(false);

  const { data: serverSettings } = useServerSettings(isAuthenticated);
  const updateSettingsMutation = useUpdateSettings();

  // Sync with server when authenticated
  useEffect(() => {
    if (!serverSettings) return;
    setSettingsState((prev) => {
      const newSettings: StoredSettings = {
        displayUnit:
          (serverSettings.displayUnit as "kg" | "lbs" | null) ??
          prev.displayUnit ??
          DEFAULT_SETTINGS.displayUnit,
        maxWorkoutDurationMinutes:
          serverSettings.maxWorkoutDurationMinutes ??
          prev.maxWorkoutDurationMinutes ??
          DEFAULT_SETTINGS.maxWorkoutDurationMinutes,
        defaultRestTimerSeconds:
          serverSettings.defaultRestTimerSeconds ??
          prev.defaultRestTimerSeconds ??
          DEFAULT_SETTINGS.defaultRestTimerSeconds,
        defaultPrivacy:
          serverSettings.defaultPrivacy ?? prev.defaultPrivacy ?? DEFAULT_SETTINGS.defaultPrivacy,
        shareGymLocation:
          serverSettings.shareGymLocation ??
          prev.shareGymLocation ??
          DEFAULT_SETTINGS.shareGymLocation,
        shareOnlineStatus:
          serverSettings.shareOnlineStatus ??
          prev.shareOnlineStatus ??
          DEFAULT_SETTINGS.shareOnlineStatus,
        shareWorkoutStatus:
          serverSettings.shareWorkoutStatus ??
          prev.shareWorkoutStatus ??
          DEFAULT_SETTINGS.shareWorkoutStatus,
        shareWorkoutHistory:
          serverSettings.shareWorkoutHistory ??
          prev.shareWorkoutHistory ??
          DEFAULT_SETTINGS.shareWorkoutHistory,
        colorScheme:
          (serverSettings.colorScheme as "light" | "dark" | "system") ?? prev.colorScheme,
        currentGymId: serverSettings.currentGymId ?? prev.currentGymId ?? null,
        autoAddSet: prev.autoAddSet,
        autoRemoveEmptySet: prev.autoRemoveEmptySet,
        bodyweight: prev.bodyweight,
        repRanges: prev.repRanges,
      };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [serverSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<StoredSettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettingsState(newSettings);
      saveSettings(newSettings);

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
    try {
      const locale =
        Platform.OS === "ios"
          ? (NativeModules.SettingsManager?.settings?.AppleLocale ??
            NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
            "en")
          : (NativeModules.I18nManager?.localeIdentifier ?? "en");
      return locale.startsWith("en_US") || locale.startsWith("en-US") ? "lbs" : "kg";
    } catch {
      return "kg";
    }
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
