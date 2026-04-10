import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePendingFriendRequests } from "../../hooks/usePendingFriendRequests";
import { useRespondFriendRequest } from "../../hooks/useRespondFriendRequest";
import { useThemeColors } from "../../hooks/useThemeColors";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function PendingRequests() {
  const {
    data: requests = [],
    isLoading,
    refetch,
  } = usePendingFriendRequests();
  const respondMutation = useRespondFriendRequest();
  const [refreshing, setRefreshing] = useState(false);
  const colors = useThemeColors();

  const handleAccept = async (friendshipId: string) => {
    await respondMutation.mutateAsync({ friendshipId, action: "accept" });
  };

  const handleDecline = async (friendshipId: string) => {
    await respondMutation.mutateAsync({ friendshipId, action: "decline" });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="mail-open-outline" size={48} color={colors.mutedIcon} />
        <Text className="mt-3 text-lg font-semibold text-zinc-500 dark:text-zinc-400">
          No pending requests
        </Text>
        <Text className="mt-1 text-center text-sm text-zinc-400 dark:text-zinc-500">
          Friend requests will appear here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.friendship_id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerClassName="px-4"
      renderItem={({ item: request }) => (
        <View className="flex-row items-center border-b border-zinc-100 dark:border-zinc-800 py-3">
          {/* Avatar */}
          <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-500">
            <Text className="text-base font-bold text-white">
              {getInitials(request.real_name || request.username)}
            </Text>
          </View>

          {/* Name */}
          <View className="ml-3 flex-1">
            <Text className="text-base font-medium dark:text-zinc-100">{request.real_name}</Text>
            <Text className="text-sm text-zinc-400 dark:text-zinc-500">@{request.username}</Text>
          </View>

          {/* Accept / Decline buttons */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => handleAccept(request.friendship_id)}
              disabled={respondMutation.isPending}
              className="items-center justify-center rounded-lg bg-green-500 px-3 py-2 active:bg-green-600"
            >
              <Ionicons name="checkmark" size={18} color="white" />
            </Pressable>
            <Pressable
              onPress={() => handleDecline(request.friendship_id)}
              disabled={respondMutation.isPending}
              className="items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700 px-3 py-2 active:bg-zinc-300 dark:active:bg-zinc-600"
            >
              <Ionicons name="close" size={18} color={colors.secondaryText} />
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}
