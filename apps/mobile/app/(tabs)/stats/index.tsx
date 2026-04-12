import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useWorkouts } from "../../../hooks/useWorkouts";
import { useStreak } from "../../../hooks/useStreak";
import { useAllTimeStats } from "../../../hooks/useAllTimeStats";
import { useUsedExercises } from "../../../hooks/useUsedExercises";
import { useSettings } from "../../../hooks/useSettings";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { convertWeight } from "../../../services/storage";

type StatsTab = "week" | "alltime" | "exercises";

const TABS: { key: StatsTab; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "alltime", label: "All Time" },
  { key: "exercises", label: "Exercises" },
];

function formatVolume(vol: string | number): string {
  const n = typeof vol === "string" ? Number.parseFloat(vol) : vol;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(start: string, end: string | null | undefined): string {
  if (!end) return "In progress";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const mins = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

// --- This Week Tab ---

function ThisWeekTab({
  workouts,
  isLoading,
  streak,
  refreshing,
  onRefresh,
}: {
  workouts: any[];
  isLoading: boolean;
  streak: number;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const colors = useThemeColors();

  const weekStats = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeek = (workouts ?? []).filter((w) => {
      const d = new Date(w.startTime ?? w.start_time);
      return d >= startOfWeek;
    });

    const actualWorkouts = thisWeek.filter((w) => (w.kind ?? "workout") === "workout");

    let totalMinutes = 0;
    for (const w of actualWorkouts) {
      const start = new Date(w.startTime ?? w.start_time);
      const endStr = w.endTime ?? w.end_time;
      const end = endStr ? new Date(endStr) : new Date();
      totalMinutes += Math.round((end.getTime() - start.getTime()) / 60000);
    }

    // Rest days = total items - actual workouts
    const restDays = thisWeek.length - actualWorkouts.length;

    return {
      workouts: actualWorkouts.length,
      restDays,
      totalMinutes,
      thisWeekWorkouts: thisWeek,
    };
  }, [workouts]);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-24"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary card */}
      <View className="mx-4 mt-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4">
        <Text className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">This Week</Text>
        <View className="flex-row">
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-blue-500">{weekStats.workouts}</Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">Workouts</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-green-500">{weekStats.restDays}</Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">Rest Days</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-orange-500">{weekStats.totalMinutes}</Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">Minutes</Text>
          </View>
          {streak > 0 && (
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-purple-500">{streak}</Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">Streak</Text>
            </View>
          )}
        </View>
      </View>

      {/* Recent workouts */}
      <Text className="mx-4 mt-6 mb-2 text-base font-semibold text-zinc-700 dark:text-zinc-200">
        Recent Workouts
      </Text>

      {isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" />
        </View>
      ) : !workouts || workouts.length === 0 ? (
        <View className="items-center px-8 py-12">
          <Ionicons name="barbell-outline" size={48} color={colors.chevron} />
          <Text className="mt-3 text-lg font-semibold text-zinc-500 dark:text-zinc-400">
            No workouts yet
          </Text>
          <Text className="mt-1 text-center text-sm text-zinc-400 dark:text-zinc-500">
            Complete your first workout to see stats
          </Text>
        </View>
      ) : (
        workouts.map((w) => {
          const isRest = (w.kind ?? "workout") === "rest";
          return (
            <Pressable
              key={w.id}
              onPress={() => !isRest && router.push(`/(tabs)/stats/workout/${w.id}` as any)}
              className="mx-4 mb-2 flex-row items-center rounded-xl bg-white dark:bg-zinc-900 px-4 py-3 active:bg-zinc-50 dark:active:bg-zinc-800"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Ionicons
                name={isRest ? "bed-outline" : "barbell-outline"}
                size={20}
                color={isRest ? colors.successIcon : colors.accentIcon}
              />
              <View className="ml-3 flex-1">
                <Text className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                  {w.name || (isRest ? "Rest Day" : "Workout")}
                </Text>
                <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                  {formatDate(w.startTime ?? w.start_time)}
                </Text>
              </View>
              {!isRest && (
                <>
                  <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                    {formatDuration(w.startTime ?? w.start_time, w.endTime ?? w.end_time)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.chevron}
                    style={{ marginLeft: 4 }}
                  />
                </>
              )}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

// --- All Time Tab ---

function AllTimeTab({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const { data: allTimeStats, isLoading } = useAllTimeStats();
  const streak = useStreak();
  const { getDisplayUnit } = useSettings();
  const unit = getDisplayUnit();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!allTimeStats) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-zinc-400 dark:text-zinc-500">No stats available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-24"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Stats grid */}
      <View className="mx-4 mt-4 flex-row flex-wrap">
        <StatCard
          label="Workouts"
          value={String(allTimeStats.total_workouts)}
          icon="barbell-outline"
          color="#3b82f6"
        />
        <StatCard
          label={`Volume (${unit})`}
          value={formatVolume(convertWeight(Number(allTimeStats.total_volume), "kg", unit))}
          icon="trending-up-outline"
          color="#22c55e"
        />
        <StatCard
          label="Hours"
          value={String(Math.round(allTimeStats.total_time_minutes / 60))}
          icon="time-outline"
          color="#f97316"
        />
        <StatCard
          label="Sets"
          value={formatVolume(allTimeStats.total_sets)}
          icon="layers-outline"
          color="#8b5cf6"
        />
        <StatCard
          label="Current Streak"
          value={String(streak)}
          icon="flame-outline"
          color="#ef4444"
        />
        <StatCard
          label="Best Streak"
          value={String(allTimeStats.best_streak)}
          icon="trophy-outline"
          color="#eab308"
        />
      </View>

      {/* Top exercises */}
      {allTimeStats.top_exercises?.length > 0 && (
        <>
          <Text className="mx-4 mt-6 mb-2 text-base font-semibold text-zinc-700 dark:text-zinc-200">
            Top 10 Exercises
          </Text>
          {allTimeStats.top_exercises.map((ex: any, i: number) => (
            <View
              key={ex.id}
              className="mx-4 mb-2 flex-row items-center rounded-xl bg-white dark:bg-zinc-900 px-4 py-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Text className="w-7 text-base font-bold text-zinc-300 dark:text-zinc-500">
                {i + 1}
              </Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                  {ex.name}
                </Text>
                <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                  {ex.workout_count} workouts · {ex.total_sets} sets ·{" "}
                  {formatVolume(convertWeight(Number(ex.total_volume), "kg", unit))} {unit}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Muscle group volume */}
      {allTimeStats.muscle_group_volume?.length > 0 && (
        <>
          <Text className="mx-4 mt-6 mb-2 text-base font-semibold text-zinc-700 dark:text-zinc-200">
            Muscle Group Volume
          </Text>
          {allTimeStats.muscle_group_volume.map((mg: any) => (
            <View
              key={mg.group}
              className="mx-4 mb-2 rounded-xl bg-white dark:bg-zinc-900 px-4 py-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {mg.group}
                </Text>
                <Text className="text-xs text-zinc-400 dark:text-zinc-500">
                  {formatVolume(convertWeight(Number(mg.volume), "kg", unit))} {unit}
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <View
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${mg.percentage}%` }}
                />
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View className="mb-3 w-1/2 px-1.5">
      <View
        className="rounded-2xl bg-white dark:bg-zinc-900 p-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <Ionicons name={icon as any} size={20} color={color} style={{ marginBottom: 8 }} />
        <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</Text>
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">{label}</Text>
      </View>
    </View>
  );
}

// --- Exercises Tab ---

function ExercisesTab({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const router = useRouter();
  const colors = useThemeColors();
  const { getDisplayUnit } = useSettings();
  const unit = getDisplayUnit();
  const {
    data: usedExercisesData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch,
  } = useUsedExercises();
  const usedExercises = usedExercisesData?.pages.flat() ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh();
  }, [refetch, onRefresh]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">Loading exercises...</Text>
      </View>
    );
  }

  if (usedExercises.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="fitness-outline" size={48} color={colors.chevron} />
        <Text className="mt-3 text-lg font-semibold text-zinc-500 dark:text-zinc-400">
          No exercises yet
        </Text>
        <Text className="mt-1 text-center text-sm text-zinc-400 dark:text-zinc-500">
          Complete workouts to see your exercises
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={usedExercises}
      keyExtractor={(item) => item.id}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      contentContainerClassName="pt-2 pb-24"
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => router.push(`/(tabs)/stats/exercise/${item.id}` as any)}
          className="mx-4 mb-2 flex-row items-center rounded-xl bg-white dark:bg-zinc-900 px-4 py-3 active:bg-zinc-50 dark:active:bg-zinc-800"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Text className="w-8 text-base font-bold text-zinc-300 dark:text-zinc-500">
            {index + 1}
          </Text>
          <View className="flex-1">
            <Text className="text-base font-medium text-zinc-900 dark:text-zinc-50">
              {item.name}
            </Text>
            <Text className="text-sm text-zinc-400 dark:text-zinc-500">
              {item.workout_count} workouts · {item.total_sets} sets ·{" "}
              {formatVolume(item.total_volume)} {unit}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
        </Pressable>
      )}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="items-center py-4">
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
    />
  );
}

// --- Main Screen ---

export default function StatsScreen() {
  const [activeTab, setActiveTab] = useState<StatsTab>("week");
  const [refreshing, setRefreshing] = useState(false);
  const { data: workouts, isLoading, refetch: refetchWorkouts } = useWorkouts(1, 20);
  const streak = useStreak();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchWorkouts();
    setRefreshing(false);
  }, [refetchWorkouts]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pb-2 pt-4">
        <Text className="text-3xl font-bold dark:text-zinc-100">Stats</Text>
      </View>

      {/* Segmented Control */}
      <View className="mx-4 mb-3 flex-row rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 items-center justify-center rounded-lg py-2 ${
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
              <Text
                className={`text-sm font-medium ${
                  isActive ? "text-blue-500" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab Content */}
      {activeTab === "week" && (
        <ThisWeekTab
          workouts={workouts ?? []}
          isLoading={isLoading}
          streak={streak}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === "alltime" && <AllTimeTab refreshing={refreshing} onRefresh={handleRefresh} />}

      {activeTab === "exercises" && (
        <ExercisesTab refreshing={refreshing} onRefresh={handleRefresh} />
      )}
    </SafeAreaView>
  );
}
