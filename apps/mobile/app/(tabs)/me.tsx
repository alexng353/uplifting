import { useMemo, useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import { useMe } from "../../hooks/useMe";
import { useWorkouts } from "../../hooks/useWorkouts";
import { useStreak } from "../../hooks/useStreak";
import { useSync } from "../../hooks/useSync";
import { useThemeColors } from "../../hooks/useThemeColors";
import { weekSummary } from "../../lib/week-summary";
import SyncBanner from "../../components/SyncBanner";
import MusclesWorked from "../../components/stats/MusclesWorked";
import { api, unwrap } from "../../lib/api";
import { weekExerciseSets, type DetailWorkout } from "../../lib/week-sets";

/** First word of a workout name for the day label ("Push day" -> "Push"). */
function shortName(name?: string | null): string {
  return (name || "Done").split(" ")[0];
}

export default function MeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const { data: me } = useMe();
  const { data: workouts } = useWorkouts(1, 20);
  const streak = useStreak();
  const { isOnline, hasPendingWorkout, isSyncing, lastSyncTime, forceSync } = useSync();

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

  // This week, laid out for the card (Sunday start, like Stats and the streak).
  const week = useMemo(() => weekSummary(workouts ?? []), [workouts]);

  // This week's sets per exercise for the muscle map. Same query key as the workout screen,
  // so opening a workout reuses these.
  const weekDetails = useQueries({
    queries: week.workouts.map((w) => ({
      queryKey: ["workout", w.id],
      queryFn: async () => unwrap(await api.api.v1.workouts({ workoutId: w.id }).get()),
      staleTime: 5 * 60_000,
    })),
  });
  const weekSets = useMemo(
    () => weekExerciseSets(weekDetails.map((q) => q.data as DetailWorkout | undefined)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekDetails.map((q) => q.dataUpdatedAt).join(",")],
  );

  const formatDuration = (start: string | Date, end?: string | Date | null): string => {
    if (!end) return "In progress";
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
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

  const displayName = me?.real_name || me?.username || "User";

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-black" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Sync Banner */}
        <SyncBanner
          isOnline={isOnline}
          hasPendingWorkout={hasPendingWorkout}
          isSyncing={isSyncing}
          onSync={forceSync}
        />

        <View className="px-4 pt-4">
          {/* Header: avatar, name, streak */}
          <View className="mb-5 flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-ember-100 dark:bg-ember-950">
              <Text className="text-lg font-bold text-ember-700 dark:text-ember-500">
                {initials}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold dark:text-zinc-100">{displayName}</Text>
              {me?.username && (
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">@{me.username}</Text>
              )}
            </View>
            {streak > 0 && (
              <View
                testID="streak-chip"
                className="flex-row items-center gap-1 rounded-full bg-ember-100 dark:bg-ember-950 px-3 py-1.5"
              >
                <Ionicons name="flame" size={16} color={colors.accentIcon} />
                <Text className="text-sm font-bold text-ember-700 dark:text-ember-500">
                  {streak}
                </Text>
              </View>
            )}
          </View>

          {/* This week */}
          <View className="mb-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold dark:text-zinc-100">This week</Text>
              <Text className="text-sm text-zinc-400 dark:text-zinc-500">{week.range}</Text>
            </View>
            <View className="flex-row justify-between">
              {week.days.map((day) => {
                const done = !!day.workout;
                return (
                  <View key={day.date.toISOString()} className="items-center" style={{ width: 44 }}>
                    <Text className="mb-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                      {day.letter}
                    </Text>
                    <View
                      testID={done ? "day-done" : day.isToday ? "day-today" : "day"}
                      className="items-center justify-center rounded-full"
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: done
                          ? colors.successIcon
                          : day.rest
                            ? colors.inputBorder
                            : colors.subtleBg,
                        borderWidth: day.isToday && !done ? 2 : 0,
                        borderStyle: "dashed",
                        borderColor: colors.accentIcon,
                        opacity: day.isFuture ? 0.6 : 1,
                      }}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={18} color="#03170D" />
                      ) : (
                        <Text
                          className="text-sm font-semibold"
                          style={{ color: day.isToday ? colors.accentIcon : colors.secondaryText }}
                        >
                          {day.dayOfMonth}
                        </Text>
                      )}
                    </View>
                    <Text
                      numberOfLines={1}
                      className="mt-1 text-[10px] font-semibold"
                      style={{ color: colors.successIcon }}
                    >
                      {day.workout ? shortName(day.workout.name) : day.rest ? "Rest" : " "}
                    </Text>
                  </View>
                );
              })}
            </View>
            {week.gymDays > 0 && (
              <View className="mt-3 flex-row items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <Ionicons name="location-outline" size={18} color={colors.successIcon} />
                <Text className="text-base font-semibold dark:text-zinc-100">
                  {week.gymDays} gym day{week.gymDays !== 1 ? "s" : ""}
                  {week.topGym ? ` at ${week.topGym}` : ""}
                </Text>
              </View>
            )}
          </View>

          {/* Week stats strip */}
          <View className="mb-6 flex-row justify-around rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-4">
            <View className="items-center">
              <Text className="text-3xl font-bold dark:text-zinc-100">{week.workouts.length}</Text>
              <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                workout{week.workouts.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold dark:text-zinc-100">{week.totalMinutes}</Text>
              <Text className="text-sm text-zinc-400 dark:text-zinc-500">min</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold dark:text-zinc-100">{week.gymDays}</Text>
              <Text className="text-sm text-zinc-400 dark:text-zinc-500">at the gym</Text>
            </View>
          </View>

          {/* This week's muscles */}
          {weekSets.length > 0 && (
            <MusclesWorked
              embedded
              testID="me-muscles"
              title="Muscles this week"
              caption="Brighter means more sets this week. Tap for all time."
              exercises={weekSets}
              onPress={() => router.push("/(tabs)/stats?tab=alltime" as any)}
            />
          )}

          {/* Recent */}
          {workouts && workouts.length > 0 && (
            <>
              <View className="mb-2 flex-row items-center justify-between px-1">
                <Text className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Recent
                </Text>
                <Pressable onPress={() => router.push("/(tabs)/stats")} hitSlop={8}>
                  <Text className="text-sm font-semibold text-ember-700 dark:text-ember-500">
                    All workouts
                  </Text>
                </Pressable>
              </View>
              <View className="mb-4 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                {workouts.slice(0, 5).map((w, i) => (
                  <Pressable
                    key={w.id}
                    className={`flex-row items-center justify-between px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-900 ${
                      i > 0 ? "border-t border-zinc-100 dark:border-zinc-800" : ""
                    }`}
                    onPress={() => router.push(`/(tabs)/stats/workout/${w.id}`)}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-semibold dark:text-zinc-100">
                        {w.name || (w.kind === "rest" ? "Rest Day" : "Workout")}
                      </Text>
                      <Text numberOfLines={1} className="text-sm text-zinc-400 dark:text-zinc-500">
                        {new Date(w.startTime).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {w.gymLocation ? ` · ${w.gymLocation}` : ""}
                      </Text>
                    </View>
                    <Text className="text-base font-semibold dark:text-zinc-100">
                      {w.kind === "rest" ? "" : formatDuration(w.startTime, w.endTime)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
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
