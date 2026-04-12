import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useFeed } from "../../hooks/useFeed";
import { useFriendsList } from "../../hooks/useFriendsList";
import { usePendingFriendRequests } from "../../hooks/usePendingFriendRequests";
import { useSettings } from "../../hooks/useSettings";
import { useThemeColors } from "../../hooks/useThemeColors";

import FeedCard from "../../components/friends/FeedCard";
import FriendSearch from "../../components/friends/FriendSearch";
import FriendsList from "../../components/friends/FriendsList";
import PendingRequests from "../../components/friends/PendingRequests";

type TabType = "feed" | "friends" | "requests";

const TABS: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "feed", label: "Feed", icon: "newspaper-outline" },
  { key: "friends", label: "Friends", icon: "people-outline" },
  { key: "requests", label: "Requests", icon: "mail-outline" },
];

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [showSearch, setShowSearch] = useState(false);

  const {
    data: feedData,
    isLoading: feedLoading,
    refetch: refetchFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed();
  const { data: friendsData, refetch: refetchFriends } = useFriendsList();
  const { data: pendingRequests = [], refetch: refetchRequests } = usePendingFriendRequests();
  const { getDisplayUnit } = useSettings();
  const unit = getDisplayUnit();
  const colors = useThemeColors();

  const feed = feedData?.pages.flat() ?? [];
  const pendingCount = pendingRequests.length;
  const friendsCount = friendsData?.length ?? 0;

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === "feed") {
      await refetchFeed();
    } else if (activeTab === "friends") {
      await refetchFriends();
    } else {
      await refetchRequests();
    }
    setRefreshing(false);
  }, [activeTab, refetchFeed, refetchFriends, refetchRequests]);

  const handleEndReached = useCallback(() => {
    if (activeTab === "feed" && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [activeTab, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pb-2 pt-4">
        <Text className="text-3xl font-bold dark:text-zinc-100">Friends</Text>
      </View>

      {/* Segmented Control */}
      <View className="mx-4 mb-3 flex-row rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2 ${
                isActive ? "bg-white dark:bg-zinc-700" : ""
              }`}
              style={
                isActive
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  : undefined
              }
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={isActive ? colors.accentIcon : colors.secondaryText}
              />
              <Text
                className={`text-sm font-medium ${
                  isActive ? "text-blue-500" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {tab.label}
                {tab.key === "friends" && friendsCount > 0 ? ` (${friendsCount})` : ""}
              </Text>
              {/* Badge for requests */}
              {tab.key === "requests" && pendingCount > 0 && (
                <View className="ml-0.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 py-0.5">
                  <Text className="text-[10px] font-bold text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Tab Content */}
      {activeTab === "feed" && (
        <>
          {feedLoading && feed.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
              <Text className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">Loading feed...</Text>
            </View>
          ) : feed.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <Ionicons name="newspaper-outline" size={48} color={colors.mutedIcon} />
              <Text className="mt-3 text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                No workouts yet
              </Text>
              <Text className="mt-1 text-center text-sm text-zinc-400 dark:text-zinc-500">
                Add friends to see their workouts here
              </Text>
              <Pressable
                onPress={() => setShowSearch(true)}
                className="mt-4 flex-row items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 active:bg-blue-600"
              >
                <Ionicons name="person-add" size={16} color="white" />
                <Text className="text-base font-semibold text-white">Find Friends</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={feed}
              keyExtractor={(item: any) => item.workout_id}
              renderItem={({ item }: { item: any }) => <FeedCard item={item} unit={unit} />}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
              contentContainerClassName="pt-2 pb-24"
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View className="items-center py-4">
                    <ActivityIndicator size="small" />
                  </View>
                ) : null
              }
            />
          )}
        </>
      )}

      {activeTab === "friends" && (
        <View className="flex-1">
          <FriendsList />
        </View>
      )}

      {activeTab === "requests" && (
        <View className="flex-1">
          <PendingRequests />
        </View>
      )}

      {/* FAB - Find Friends */}
      <Pressable
        onPress={() => setShowSearch(true)}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-500 active:bg-blue-600"
        style={{
          shadowColor: "#3b82f6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="person-add" size={24} color="white" />
      </Pressable>

      {/* Friend Search Modal */}
      <FriendSearch visible={showSearch} onClose={() => setShowSearch(false)} />
    </SafeAreaView>
  );
}
