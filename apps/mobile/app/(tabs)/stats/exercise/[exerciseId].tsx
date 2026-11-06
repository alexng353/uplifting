import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from "react-native";
import { matchFont } from "@shopify/react-native-skia";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { CartesianChart, Line, Scatter } from "victory-native";

import { useExerciseHistory } from "../../../../hooks/useExerciseHistory";
import { useSettings } from "../../../../hooks/useSettings";
import { useThemeColors } from "../../../../hooks/useThemeColors";
import { api, unwrap } from "../../../../lib/api";
import { convertWeight } from "../../../../services/storage";
import { formatTimedSet, timedFromServer } from "../../../../lib/timed";
import {
  availableModes,
  defaultMode,
  filterByMode,
  isTimedHistory,
  minutesSeries,
  peakSeries,
  xTickLabel,
  type ChartMode,
} from "../../../../lib/exercise-chart";

// Axis labels only draw when the chart gets a Skia font.
const AXIS_FONT = matchFont({
  fontFamily: Platform.select({ ios: "Helvetica", default: "sans-serif" }),
  fontSize: 11,
});

const MODE_LABEL: Record<ChartMode, string> = { bi: "Bilateral", side: "Per side" };

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

  const months = timeRange === "all" ? null : Number.parseInt(timeRange, 10);
  const { data: history, isLoading } = useExerciseHistory(exerciseId!, months);

  // Fetch exercise name
  const { data: exercise } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: async () => {
      try {
        return unwrap(await api.api.v1.exercises({ exerciseId: exerciseId! }).get());
      } catch {
        return null;
      }
    },
    enabled: !!exerciseId,
  });

  const exerciseName = exercise?.name ?? "Exercise";

  const historyData = history?.history ?? [];

  // Sort history descending by date (most recent first)
  const sortedHistory = useMemo(() => {
    return [...historyData].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [historyData]);

  // Bilateral and per-side sets are charted apart: a one-handed 45 on the same line as a
  // two-handed 90 looks like a collapse. Defaults to the mode of the newest session.
  // Timed exercises (treadmill walks) chart total minutes and have no side modes.
  const isTimed = useMemo(() => isTimedHistory(sortedHistory), [sortedHistory]);
  const modes = useMemo(
    () => (isTimed ? [] : availableModes(sortedHistory)),
    [sortedHistory, isTimed],
  );
  const [pickedMode, setPickedMode] = useState<ChartMode | null>(null);
  const mode: ChartMode =
    pickedMode && modes.includes(pickedMode) ? pickedMode : defaultMode(sortedHistory);
  const shownHistory = useMemo(
    () => (modes.length > 1 ? filterByMode(sortedHistory, mode) : sortedHistory),
    [sortedHistory, modes, mode],
  );

  // Peak weight per session, x by date.
  const chartData = useMemo(
    () =>
      isTimed
        ? minutesSeries(shownHistory)
        : peakSeries(shownHistory, (s) =>
            convertWeight(Number(s.weight), (s.weight_unit ?? "kg") as any, unit),
          ),
    [shownHistory, unit, isTimed],
  );
  const spanMs =
    chartData.length > 1 ? chartData[chartData.length - 1].dateMs - chartData[0].dateMs : 0;

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatSet = (s: any): string => {
    if (s.duration_seconds != null) return formatTimedSet(timedFromServer(s));
    const weight = convertWeight(Number(s.weight), s.weight_unit ?? "kg", unit);
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
          <Ionicons name="chevron-back" size={24} color="#F2894B" />
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
                  isActive ? "text-ember-500" : "text-zinc-500 dark:text-zinc-400"
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
          <Text className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">Loading history...</Text>
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
          {modes.length > 1 && (
            <View
              testID="chart-mode"
              className="mx-4 mb-3 flex-row rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1"
            >
              {modes.map((m) => {
                const active = m === mode;
                return (
                  <Pressable
                    key={m}
                    testID={`chart-mode-${m}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setPickedMode(m)}
                    className={`flex-1 items-center rounded-lg py-1.5 ${active ? "bg-white dark:bg-zinc-700" : ""}`}
                  >
                    <Text
                      className={`text-sm font-medium ${active ? "text-ember-500" : "text-zinc-500 dark:text-zinc-400"}`}
                    >
                      {MODE_LABEL[m]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Weight progression chart */}
          {chartData.length >= 2 && (
            <View className="mx-4 mb-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 p-3">
              <Text className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {isTimed
                  ? "Total minutes"
                  : `Peak weight (${unit})${mode === "side" && modes.length > 1 ? " · per side" : ""}`}
              </Text>
              <View style={{ height: 220 }}>
                <CartesianChart
                  data={chartData}
                  xKey="dateMs"
                  yKeys={["weight"]}
                  domainPadding={{ top: 20, bottom: 10, left: 10, right: 10 }}
                  xAxis={{
                    labelColor: colors.secondaryText,
                    lineColor: colors.separator,
                    font: AXIS_FONT,
                    tickCount: 4,
                    formatXLabel: (val) => xTickLabel(val as number, spanMs),
                  }}
                  yAxis={[
                    {
                      labelColor: colors.secondaryText,
                      lineColor: colors.separator,
                      font: AXIS_FONT,
                      tickCount: 5,
                      formatYLabel: (val) => `${Math.round(val as number)}`,
                    },
                  ]}
                >
                  {({ points }) => (
                    <>
                      <Line
                        points={points.weight}
                        color={colors.accentIcon}
                        strokeWidth={2}
                        curveType="monotoneX"
                      />
                      <Scatter
                        points={points.weight}
                        color={colors.accentIcon}
                        radius={4}
                        shape="circle"
                      />
                    </>
                  )}
                </CartesianChart>
              </View>
            </View>
          )}

          {shownHistory.map((entry: any) => (
            <Pressable
              key={entry.workout_id}
              onPress={() => router.push(`/(tabs)/stats/workout/${entry.workout_id}` as any)}
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
                {entry.sets.length} set{entry.sets.length === 1 ? "" : "s"} ·{" "}
                {entry.sets.map(formatSet).join(", ")}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
