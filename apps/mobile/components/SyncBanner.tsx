import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  if (isOnline && !hasPendingWorkout) return null;

  const isOffline = !isOnline;

  return (
    <View
      className={`flex-row items-center justify-between px-4 py-2 ${
        isOffline ? "bg-red-100" : "bg-amber-100"
      }`}
    >
      <View className="flex-row items-center gap-2">
        <Ionicons
          name="warning"
          size={18}
          color={isOffline ? "#dc2626" : "#d97706"}
        />
        <Text
          className={`text-sm font-medium ${
            isOffline ? "text-red-800" : "text-amber-800"
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
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : (
          <Ionicons name="refresh" size={16} color="#3b82f6" />
        )}
        <Text className="text-sm font-medium text-blue-500">
          {isSyncing ? "Syncing..." : "Sync"}
        </Text>
      </Pressable>
    </View>
  );
}
