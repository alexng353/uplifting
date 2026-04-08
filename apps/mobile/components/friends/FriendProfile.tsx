import { View, Text, Pressable, ScrollView, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFriendWorkouts } from "../../hooks/useFriendWorkouts";
import { useSettings } from "../../hooks/useSettings";

interface Friend {
  friendship_id: string;
  user_id: string;
  username: string;
  real_name: string;
  avatar_url?: string | null;
  is_online?: boolean | null;
  is_in_workout?: boolean | null;
  current_workout_name?: string | null;
  current_workout_started_at?: string | null;
}

interface FriendProfileProps {
  friend: Friend;
  visible: boolean;
  onClose: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatVolume(volume: string | number): string {
  const num = typeof volume === "string" ? Number.parseFloat(volume) : volume;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(Math.round(num));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function FriendProfile({
  friend,
  visible,
  onClose,
}: FriendProfileProps) {
  const { data, isLoading } = useFriendWorkouts(friend.user_id, visible);
  const { getDisplayUnit } = useSettings();
  const unit = getDisplayUnit();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-zinc-200 px-4 pb-3 pt-4">
          <Text className="text-xl font-bold">{friend.real_name}</Text>
          <Pressable onPress={onClose}>
            <Text className="text-base font-medium text-blue-500">Done</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="pb-8">
          {/* Profile Header */}
          <View className="items-center px-4 py-6">
            <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-blue-500">
              <Text className="text-2xl font-bold text-white">
                {getInitials(friend.realName)}
              </Text>
            </View>
            <Text className="text-xl font-bold">{friend.real_name}</Text>
            <Text className="text-sm text-zinc-400">@{friend.username}</Text>

            {/* Status badges */}
            <View className="mt-2 flex-row gap-2">
              {friend.is_online === true && (
                <View className="flex-row items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1">
                  <View className="h-2 w-2 rounded-full bg-green-500" />
                  <Text className="text-xs font-medium text-green-700">
                    Online
                  </Text>
                </View>
              )}
              {friend.is_in_workout === true && (
                <View className="flex-row items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
                  <Ionicons name="barbell" size={12} color="#3b82f6" />
                  <Text className="text-xs font-medium text-blue-700">
                    {friend.current_workout_name || "Working out"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" />
            </View>
          ) : data ? (
            <>
              {/* This Week Summary */}
              {(data as any).week_stats?.workout_count > 0 && (
                <View className="mx-4 mb-4 rounded-xl border border-zinc-200 bg-white p-4">
                  <View className="mb-3 flex-row items-center gap-1">
                    <Ionicons name="flame" size={16} color="#f59e0b" />
                    <Text className="text-base font-semibold">This Week</Text>
                  </View>
                  <View className="flex-row justify-center gap-8">
                    <View className="items-center">
                      <Text className="text-2xl font-bold">
                        {(data as any).week_stats.workout_count}
                      </Text>
                      <Text className="text-xs uppercase text-zinc-400">
                        Workouts
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-2xl font-bold">
                        {formatVolume((data as any).week_stats.total_volume)}
                      </Text>
                      <Text className="text-xs uppercase text-zinc-400">
                        Volume ({unit})
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-2xl font-bold">
                        {formatDuration((data as any).week_stats.total_duration_minutes)}
                      </Text>
                      <Text className="text-xs uppercase text-zinc-400">
                        Time
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Recent Workouts */}
              <View className="mx-4 mb-4">
                <Text className="mb-3 text-lg font-semibold">
                  Recent Workouts
                </Text>
                {(data as any).workouts.length === 0 ? (
                  <Text className="text-center text-base text-zinc-400">
                    No workouts yet
                  </Text>
                ) : (
                  (data as any).workouts.map(
                    (workout: {
                      id: string;
                      name: string | null;
                      start_time: string;
                      duration_minutes: number;
                      total_volume: number;
                      total_sets: number;
                    }) => (
                      <View
                        key={workout.id}
                        className="mb-2 rounded-xl border border-zinc-200 bg-white p-4"
                      >
                        <Text className="text-xs text-zinc-400">
                          {formatDate(workout.start_time)}
                        </Text>
                        <Text className="mt-1 text-base font-semibold">
                          {workout.name || "Workout"}
                        </Text>
                        <View className="mt-2 flex-row gap-4">
                          <View className="flex-row items-center gap-1">
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color="#71717a"
                            />
                            <Text className="text-sm text-zinc-500">
                              {formatDuration(workout.duration_minutes)}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Ionicons
                              name="trending-up"
                              size={14}
                              color="#71717a"
                            />
                            <Text className="text-sm text-zinc-500">
                              {formatVolume(workout.total_volume)} {unit}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Ionicons
                              name="barbell-outline"
                              size={14}
                              color="#71717a"
                            />
                            <Text className="text-sm text-zinc-500">
                              {workout.total_sets} sets
                            </Text>
                          </View>
                        </View>
                      </View>
                    ),
                  )
                )}
              </View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
