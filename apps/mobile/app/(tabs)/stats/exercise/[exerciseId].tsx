import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { useExerciseHistory } from "../../../../hooks/useExerciseHistory";
import { useSettings } from "../../../../hooks/useSettings";
import { useThemeColors } from "../../../../hooks/useThemeColors";
import { api } from "../../../../lib/api";
import { convertWeight } from "../../../../services/storage";

type TimeRange = "1" | "6" | "12" | "all";

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "1", label: "1M" },
  { key: "6", label: "6M" },
  { key: "12", label: "1Y" },
  { key: "all", label: "All" },
];

export default function ExerciseHistoryScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const [timeRange, setTimeRange] = useState<TimeRange>("6");
  const { getDisplayUnit } = useSettings();
  const unit = getDisplayUnit();

  const months =
    timeRange === "all" ? null : Number.parseInt(timeRange, 10);
  const { data: history, isLoading } = useExerciseHistory(
    exerciseId!,
    months,
  );

  // Fetch exercise name
  const { data: exercise } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: async () => {
      const { data, error } = await (api.api.v1.exercises as any)[
        exerciseId!
      ].get();
      if (error || !data) return null;
      return data;
    },
    enabled: !!exerciseId,
  });

  const exerciseName = (exercise as any)?.name ?? "Exercise";

  const historyData = (history as any)?.history ?? [];

  // Sort history descending by date (most recent first)
  const sortedHistory = useMemo(() => {
    return [...historyData].sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [historyData]);

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatSet = (s: any): string => {
    const weight = convertWeight(
      Number(s.weight),
      s.weight_unit ?? "kg",
      unit,
    );
    if (s.side) {
      return `${s.reps}x${weight}${unit} ${s.side}`;
    }
    return `${s.reps}x${weight}${unit}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="chevron-back" size={24} color="#3b82f6" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold dark:text-zinc-100" numberOfLines={1}>
          {exerciseName}
        </Text>
      </View>

      {/* Time range segmented control */}
      <View className="mx-4 mb-3 flex-row rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
        {TIME_RANGES.map((tr) => {
          const isActive = timeRange === tr.key;
          return (
            <Pressable
              key={tr.key}
              onPress={() => setTimeRange(tr.key)}
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
                {tr.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            Loading history...
          </Text>
        </View>
      ) : sortedHistory.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="document-text-outline" size={48} color={colors.chevron} />
          <Text className="mt-3 text-lg font-semibold text-zinc-500 dark:text-zinc-400">
            No history
          </Text>
          <Text className="mt-1 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No data for this exercise in the selected time range
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="pb-24">
          {sortedHistory.map((entry: any) => (
            <Pressable
              key={entry.workout_id}
              onPress={() =>
                router.push(
                  `/(tabs)/stats/workout/${entry.workout_id}` as any,
                )
              }
              className="mx-4 mb-3 rounded-xl bg-white dark:bg-zinc-900 px-4 py-3 active:bg-zinc-50 dark:active:bg-zinc-800"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {formatDate(entry.date)}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.chevron} />
              </View>
              <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                {entry.sets.length} sets ·{" "}
                {entry.sets.map(formatSet).join(", ")}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
