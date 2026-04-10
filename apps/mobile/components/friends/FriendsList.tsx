import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFriendsList } from "../../hooks/useFriendsList";
import { useThemeColors } from "../../hooks/useThemeColors";
import FriendProfile from "./FriendProfile";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatWorkoutDuration(startedAt: string): string {
  const started = new Date(startedAt);
  const now = new Date();
  const minutes = Math.floor((now.getTime() - started.getTime()) / 60_000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default function FriendsList() {
  const { data: friends = [], isLoading, refetch } = useFriendsList();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const colors = useThemeColors();

  const selectedFriend = friends.find(
    (f) => f.user_id === selectedFriendId,
  );

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      if (a.is_in_workout && !b.is_in_workout) return -1;
      if (!a.is_in_workout && b.is_in_workout) return 1;
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.real_name.localeCompare(b.real_name);
    });
  }, [friends]);

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

  if (friends.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="people-outline" size={48} color={colors.mutedIcon} />
        <Text className="mt-3 text-lg font-semibold text-zinc-500 dark:text-zinc-400">
          No friends yet
        </Text>
        <Text className="mt-1 text-center text-sm text-zinc-400 dark:text-zinc-500">
          Search for people to add them as friends
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={sortedFriends}
        keyExtractor={(item) => item.friendship_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerClassName="px-4"
        renderItem={({ item: friend }) => (
          <Pressable
            onPress={() => setSelectedFriendId(friend.user_id)}
            className="flex-row items-center border-b border-zinc-100 dark:border-zinc-800 py-3 active:bg-zinc-50 dark:active:bg-zinc-800"
          >
            {/* Avatar with online indicator */}
            <View className="relative">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-500">
                <Text className="text-base font-bold text-white">
                  {getInitials(friend.real_name)}
                </Text>
              </View>
              {friend.is_online === true && (
                <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-900 bg-green-500" />
              )}
            </View>

            {/* Name + status */}
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium dark:text-zinc-100">{friend.real_name}</Text>
              <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                @{friend.username}
              </Text>
              {friend.is_in_workout === true && (
                <View className="mt-0.5 flex-row items-center gap-1">
                  <Ionicons name="barbell-outline" size={12} color={colors.accentIcon} />
                  <Text className="text-xs text-blue-500">
                    {friend.current_workout_name || "Working out"}
                  </Text>
                </View>
              )}
            </View>

            {/* Workout icon on the right */}
            {friend.is_in_workout === true && (
              <Ionicons name="barbell" size={20} color={colors.accentIcon} />
            )}

            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.chevron}
              style={{ marginLeft: 4 }}
            />
          </Pressable>
        )}
      />

      {selectedFriend && (
        <FriendProfile
          friend={selectedFriend}
          visible={!!selectedFriendId}
          onClose={() => setSelectedFriendId(null)}
        />
      )}
    </>
  );
}
