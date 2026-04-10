import { useMemo } from "react";
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

import { useSettings } from "../../../../hooks/useSettings";
import { useThemeColors } from "../../../../hooks/useThemeColors";
import { api, unwrap } from "../../../../lib/api";
import { convertWeight } from "../../../../services/storage";

export default function WorkoutDetailScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { formatWeight, getDisplayUnit } = useSettings();
  const unit = getDisplayUnit();

  // Fetch workout with sets
  const {
    data: workout,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: async () => {
      return unwrap(await api.api.v1.workouts({ workoutId: workoutId! }).get());
    },
    enabled: !!workoutId,
  });

  // Fetch exercises for names
  const { data: exercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      return unwrap(
        await api.api.v1.exercises.get({
          query: { limit: "500" },
        }),
      );
    },
  });

  const exerciseMap = useMemo(() => {
    return new Map(exercises.map((e) => [e.id, e]));
  }, [exercises]);

  const exerciseGroups: any[] = workout?.exercises ?? [];

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: string | Date): string => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getDuration = (): number => {
    const start = workout?.startTime;
    const end = workout?.endTime;
    if (!start || !end) return 0;
    return Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 60000,
    );
  };

  const getTotalSets = (): number => {
    return exerciseGroups.reduce((total: number, group: any) => {
      if (group.is_unilateral) {
        return (
          total +
          group.sets.filter((s: any) => s.side === "R" || !s.side).length
        );
      }
      return total + group.sets.length;
    }, 0);
  };

  const getTotalVolume = (): number => {
    return exerciseGroups.reduce((total: number, group: any) => {
      const ex = exerciseMap.get(group.exercise_id);
      const isBw = ex?.exercise_type === "Bodyweight";
      return (
        total +
        group.sets.reduce((sum: number, s: any) => {
          const weight = Number.parseFloat(s.weight);
          const bw =
            isBw && s.bodyweight ? Number.parseFloat(s.bodyweight) : 0;
          return sum + s.reps * (weight + bw);
        }, 0)
      );
    }, 0);
  };

  const getExerciseName = (exerciseId: string): string => {
    return exerciseMap.get(exerciseId)?.name ?? "Unknown Exercise";
  };

  const formatSetDisplay = (group: any): string => {
    const ex = exerciseMap.get(group.exercise_id);
    const isBw = ex?.exercise_type === "Bodyweight";

    const formatSingleSet = (s: any): string => {
      const w = Number.parseFloat(s.weight);
      const weightConverted = convertWeight(w, s.weight_unit ?? s.weightUnit ?? "kg", unit);
      if (!isBw) return `${s.reps}x${weightConverted}${unit}`;
      const bw = s.bodyweight ? Number.parseFloat(s.bodyweight) : null;
      if (bw != null) {
        const total = convertWeight(bw + w, s.weight_unit ?? s.weightUnit ?? "kg", unit);
        return w > 0
          ? `${s.reps}x${total}${unit}`
          : `${s.reps}x${convertWeight(bw, s.weight_unit ?? s.weightUnit ?? "kg", unit)}${unit}`;
      }
      return w > 0 ? `${s.reps}xBW+${weightConverted}${unit}` : `${s.reps}xBW`;
    };

    if (group.is_unilateral) {
      const rightSets = group.sets.filter((s: any) => s.side === "R");
      const leftSets = group.sets.filter((s: any) => s.side === "L");
      const pairCount = Math.max(rightSets.length, leftSets.length);
      const pairs: string[] = [];
      for (let i = 0; i < pairCount; i++) {
        const r = rightSets[i];
        const l = leftSets[i];
        if (r && l && formatSingleSet(r) === formatSingleSet(l)) {
          pairs.push(`${formatSingleSet(r)} L/R`);
        } else {
          if (r) pairs.push(`${formatSingleSet(r)} R`);
          if (l) pairs.push(`${formatSingleSet(l)} L`);
        }
      }
      return `${pairCount} sets/side · ${pairs.join(", ")}`;
    }

    return `${group.sets.length} sets · ${group.sets.map(formatSingleSet).join(", ")}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            Loading workout...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !workout) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900">
        <View className="flex-row items-center px-4 pt-4 pb-2">
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="chevron-back" size={24} color="#3b82f6" />
          </Pressable>
          <Text className="text-xl font-bold dark:text-zinc-100">Workout</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-zinc-400 dark:text-zinc-500">Failed to load workout</Text>
        </View>
      </SafeAreaView>
    );
  }

  const startTime = workout.startTime;
  const endTime = workout.endTime;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="chevron-back" size={24} color="#3b82f6" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold dark:text-zinc-100" numberOfLines={1}>
          {workout.name || "Workout"}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-24">
        {/* Date & time */}
        <View className="mx-4 mt-2 mb-4">
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            {formatDate(startTime)}
          </Text>
          <Text className="text-sm text-zinc-400 dark:text-zinc-500">
            {formatTime(startTime)}
            {endTime && ` – ${formatTime(endTime)}`}
          </Text>
          {workout.gymLocation ? (
            <Text className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">
              {workout.gymLocation}
            </Text>
          ) : null}
        </View>

        {/* Summary stats */}
        <View className="mx-4 mb-4 flex-row rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4">
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {getDuration()}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">Minutes</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {exerciseGroups.length}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">Exercises</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {getTotalSets()}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">Sets</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {Math.round(getTotalVolume()).toLocaleString()}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">Vol ({unit})</Text>
          </View>
        </View>

        {/* Exercises */}
        <Text className="mx-4 mb-2 text-base font-semibold text-zinc-700 dark:text-zinc-200">
          Exercises
        </Text>
        {exerciseGroups.map((group: any) => {
          const groupKey = `${group.exercise_id}_${group.profile_id ?? "null"}`;
          return (
            <View
              key={groupKey}
              className="mx-4 mb-3 rounded-xl bg-white dark:bg-zinc-900 px-4 py-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Text className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                {getExerciseName(group.exercise_id)}
              </Text>
              <Text className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                {formatSetDisplay(group)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
