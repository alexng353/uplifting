import { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";

import { useMe } from "../../hooks/useMe";
import { useWorkouts } from "../../hooks/useWorkouts";
import { useStreak } from "../../hooks/useStreak";
import { useSync } from "../../hooks/useSync";
import { useThemeColors } from "../../hooks/useThemeColors";
import WeekStreak from "../../components/WeekStreak";
import type { WorkoutEntry } from "../../components/WeekStreak";
import SyncBanner from "../../components/SyncBanner";

export default function MeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const { data: me } = useMe();
  const { data: workouts } = useWorkouts(1, 20);
  const streak = useStreak();
  const { isOnline, hasPendingWorkout, isSyncing, lastSyncTime, forceSync } =
    useSync();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["me"] }),
      queryClient.invalidateQueries({ queryKey: ["workouts"] }),
      queryClient.invalidateQueries({ queryKey: ["streak"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  // Calculate this week's stats
  const weekStats = useMemo(() => {
    if (!workouts) return null;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekWorkouts = workouts.filter((w) => {
      const d = new Date(w.startTime);
      return d >= startOfWeek && w.kind === "workout";
    });

    const weekRests = workouts.filter((w) => {
      const d = new Date(w.startTime);
      return d >= startOfWeek && w.kind === "rest";
    });

    let totalMinutes = 0;
    for (const w of weekWorkouts) {
      if (!w.endTime) continue;
      const start = new Date(w.startTime);
      const end = new Date(w.endTime);
      totalMinutes += Math.round((end.getTime() - start.getTime()) / 60000);
    }

    return {
      workouts: weekWorkouts,
      restDays: weekRests.length,
      totalMinutes,
    };
  }, [workouts]);

  // Build entries for the WeekStreak component
  const weekEntries = useMemo((): WorkoutEntry[] => {
    if (!workouts) return [];

    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    return workouts
      .filter((w) => new Date(w.startTime) >= startOfWeek)
      .map((w) => ({
        date: w.startTime,
        kind: w.kind === "rest" ? ("rest" as const) : ("workout" as const),
      }));
  }, [workouts]);

  const formatTime = (date: string): string => {
    return new Date(date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (start: string, end?: string | null): string => {
    if (!end) return "In progress";
    const mins = Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 60000,
    );
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // Avatar initials from user name
  const initials = useMemo(() => {
    if (!me) return "?";
    const name = me.real_name || me.username || "";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [me]);

  const displayName =
    me?.real_name || me?.username || "User";

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 pb-2 pt-4">
          <Text className="text-3xl font-bold dark:text-zinc-100">Me</Text>
        </View>

        {/* Sync Banner */}
        <SyncBanner
          isOnline={isOnline}
          hasPendingWorkout={hasPendingWorkout}
          isSyncing={isSyncing}
          onSync={forceSync}
        />

        <View className="px-4 pt-4">
          {/* Profile Section */}
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-500">
              <Text className="text-lg font-bold text-white">{initials}</Text>
            </View>
            <View>
              <Text className="text-xl font-semibold dark:text-zinc-100">{displayName}</Text>
              {me?.username && me?.real_name && (
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                  @{me.username}
                </Text>
              )}
            </View>
          </View>

          {/* Streak Banner */}
          {streak > 0 && (
            <View className="mb-4 flex-row items-center justify-center gap-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 px-4 py-3">
              <Ionicons name="flame" size={24} color={colors.warningIcon} />
              <Text className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {streak}
              </Text>
              <Text className="text-base font-medium text-amber-600 dark:text-amber-400">
                day{streak !== 1 ? "s" : ""} streak
              </Text>
            </View>
          )}

          {/* Week Streak */}
          <View className="mb-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
            <Text className="mb-3 text-lg font-semibold dark:text-zinc-100">This Week</Text>
            <WeekStreak entries={weekEntries} size="large" />
          </View>

          {/* This Week Stats */}
          <View className="mb-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
            <Text className="mb-3 text-lg font-semibold dark:text-zinc-100">Week Stats</Text>

            {!weekStats ||
            (weekStats.workouts.length === 0 && weekStats.restDays === 0) ? (
              <Text className="text-center text-zinc-400 dark:text-zinc-500">
                No activity this week
              </Text>
            ) : (
              <>
                <View className="mb-3 flex-row justify-center gap-8">
                  <View className="items-center">
                    <Text className="text-2xl font-bold dark:text-zinc-100">
                      {weekStats.workouts.length}
                    </Text>
                    <Text className="text-xs uppercase text-zinc-400 dark:text-zinc-500">
                      {weekStats.workouts.length === 1 ? "Workout" : "Workouts"}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold dark:text-zinc-100">
                      {weekStats.totalMinutes}
                    </Text>
                    <Text className="text-xs uppercase text-zinc-400 dark:text-zinc-500">
                      Minutes
                    </Text>
                  </View>
                  {weekStats.restDays > 0 && (
                    <View className="items-center">
                      <Text className="text-2xl font-bold dark:text-zinc-100">
                        {weekStats.restDays}
                      </Text>
                      <Text className="text-xs uppercase text-zinc-400 dark:text-zinc-500">
                        Rest
                      </Text>
                    </View>
                  )}
                </View>

                {/* Workout list */}
                <View className="mt-1 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                  {weekStats.workouts.map((w) => (
                    <Pressable
                      key={w.id}
                      className="flex-row items-center justify-between border-b border-zinc-50 dark:border-zinc-800 py-3 active:bg-zinc-50 dark:active:bg-zinc-800"
                      onPress={() =>
                        router.push(`/(tabs)/stats/workout/${w.id}`)
                      }
                    >
                      <View className="flex-1">
                        <Text className="text-base font-medium dark:text-zinc-100">
                          {w.name || "Workout"}
                        </Text>
                        <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                          {formatTime(w.startTime)}
                          {w.gymLocation ? ` \u00b7 ${w.gymLocation}` : ""}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                          {formatDuration(w.startTime, w.endTime)}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.chevron}
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Recent Workouts */}
          {workouts && workouts.length > 0 && (
            <View className="mb-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
              <Text className="mb-3 text-lg font-semibold dark:text-zinc-100">
                Recent Workouts
              </Text>
              {workouts.slice(0, 5).map((w) => (
                <Pressable
                  key={w.id}
                  className="flex-row items-center justify-between border-b border-zinc-50 dark:border-zinc-800 py-3 active:bg-zinc-50 dark:active:bg-zinc-800"
                  onPress={() =>
                    router.push(`/(tabs)/stats/workout/${w.id}`)
                  }
                >
                  <View className="flex-1">
                    <Text className="text-base font-medium dark:text-zinc-100">
                      {w.name || (w.kind === "rest" ? "Rest Day" : "Workout")}
                    </Text>
                    <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                      {new Date(w.startTime).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {w.gymLocation ? ` \u00b7 ${w.gymLocation}` : ""}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                      {formatDuration(w.startTime, w.endTime)}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.chevron}
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Last Sync Time */}
          {lastSyncTime && (
            <Text className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
              Last synced: {lastSyncTime.toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
