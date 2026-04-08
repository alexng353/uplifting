import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../hooks/useThemeColors";

interface SyncBannerProps {
  isOnline: boolean;
  hasPendingWorkout: boolean;
  isSyncing: boolean;
  onSync: () => void;
}

export default function SyncBanner({
  isOnline,
  hasPendingWorkout,
  isSyncing,
  onSync,
}: SyncBannerProps) {
  const colors = useThemeColors();

  if (isOnline && !hasPendingWorkout) return null;

  const isOffline = !isOnline;

  return (
    <View
      className={`flex-row items-center justify-between px-4 py-2 ${
        isOffline ? "bg-red-100 dark:bg-red-950" : "bg-amber-100 dark:bg-amber-950"
      }`}
    >
      <View className="flex-row items-center gap-2">
        <Ionicons
          name="warning"
          size={18}
          color={isOffline ? colors.dangerIcon : colors.warningIcon}
        />
        <Text
          className={`text-sm font-medium ${
            isOffline ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"
          }`}
        >
          {isOffline ? "You're offline" : "Workout pending sync"}
        </Text>
      </View>
      <Pressable
        onPress={onSync}
        disabled={!isOnline || isSyncing}
        className={`flex-row items-center gap-1 rounded-md px-3 py-1 ${
          !isOnline || isSyncing ? "opacity-50" : ""
        }`}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color={colors.accentIcon} />
        ) : (
          <Ionicons name="refresh" size={16} color={colors.accentIcon} />
        )}
        <Text className="text-sm font-medium text-blue-500">
          {isSyncing ? "Syncing..." : "Sync"}
        </Text>
      </Pressable>
    </View>
  );
}
