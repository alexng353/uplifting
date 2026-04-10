import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { Ionicons } from "@expo/vector-icons";

import { useQueryClient } from "@tanstack/react-query";
import { useWorkout } from "../../hooks/useWorkout";
import { useWorkouts } from "../../hooks/useWorkouts";
import { useSync } from "../../hooks/useSync";
import { useThemeColors } from "../../hooks/useThemeColors";
import {
  getLocalDateString,
  getWorkoutLastSlide,
  setWorkoutLastSlide,
} from "../../services/storage";
import { api } from "../../lib/api";
import ExerciseSlide from "../../components/workout/ExerciseSlide";
import AddExerciseSlide from "../../components/workout/AddExerciseSlide";
import WorkoutSummary from "../../components/workout/WorkoutSummary";
import ReorderModal from "../../components/workout/ReorderModal";

function formatElapsed(startTime: string): string {
  const ms = Date.now() - new Date(startTime).getTime();
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function WorkoutScreen() {
  const {
    workout,
    isActive,
    todayRestDay,
    startWorkout,
    logRestDay,
    cancelRestDay,
    reconcileRestDay,
    removeExercise,
    finishWorkout,
    cancelWorkout,
  } = useWorkout();
  const { forceSync } = useSync();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const { data: serverWorkouts } = useWorkouts(1, 20);

  const todayHasWorkouts = useMemo(() => {
    if (!serverWorkouts) return false;
    const today = getLocalDateString();
    return serverWorkouts.some(
      (w: any) =>
        getLocalDateString(w.startTime) === today && w.kind === "workout",
    );
  }, [serverWorkouts]);

  const pagerRef = useRef<PagerView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");

  const workoutId = workout?.id;
  const exerciseCount = workout?.exercises.length ?? 0;

  // Update elapsed time every second
  useEffect(() => {
    if (!workout?.startTime) return;
    const update = () => setElapsedTime(formatElapsed(workout.startTime));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [workout?.startTime]);

  // Restore last slide position
  useEffect(() => {
    if (!workoutId) return;
    const stored = getWorkoutLastSlide();
    if (stored?.workoutId === workoutId && stored.slideIndex > 0) {
      // Small delay to let PagerView render
      setTimeout(() => {
        pagerRef.current?.setPage(stored.slideIndex);
      }, 100);
    }
  }, [workoutId]);

  // Clamp active slide when exercises are removed
  useEffect(() => {
    if (!workoutId) return;
    const maxIndex = exerciseCount; // includes add-exercise slide
    if (activeSlide > maxIndex) {
      pagerRef.current?.setPage(maxIndex);
      setActiveSlide(maxIndex);
    }
  }, [workoutId, exerciseCount, activeSlide]);

  // Reconcile local rest day state with server data
  useEffect(() => {
    if (serverWorkouts) {
      reconcileRestDay(serverWorkouts);
    }
  }, [serverWorkouts, reconcileRestDay]);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const position = e.nativeEvent.position;
      setActiveSlide(position);
      if (workoutId) {
        setWorkoutLastSlide(workoutId, position);
      }
    },
    [workoutId],
  );

  const handleExerciseAdded = useCallback(() => {
    // Navigate to the newly added exercise (it's at the end, before add slide)
    if (workout) {
      const newIndex = workout.exercises.length; // exercises.length is the old count, new exercise is at that index
      setTimeout(() => pagerRef.current?.setPage(newIndex), 100);
    }
  }, [workout]);

  const handleFinish = useCallback(() => {
    setShowSummary(true);
  }, []);

  const handleSave = useCallback(
    (name?: string, gymLocation?: string) => {
      finishWorkout(name, gymLocation);
      setShowSummary(false);
      forceSync();
    },
    [finishWorkout, forceSync],
  );

  const handleCancelSummary = useCallback(() => {
    setShowSummary(false);
  }, []);

  const handleCancelWorkout = useCallback(() => {
    Alert.alert(
      "Cancel Workout",
      "Are you sure you want to cancel this workout? All progress will be lost.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Cancel Workout",
          style: "destructive",
          onPress: () => cancelWorkout(),
        },
      ],
    );
  }, [cancelWorkout]);

  const handleRemoveCurrentExercise = useCallback(() => {
    if (!workout) return;
    const exercise = workout.exercises[activeSlide];
    if (!exercise) return;
    Alert.alert(
      "Remove Exercise",
      `Remove ${exercise.exerciseName} from this workout?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeExercise(exercise.exerciseId),
        },
      ],
    );
  }, [workout, activeSlide, removeExercise]);

  const handleLogRestDay = useCallback(() => {
    const result = logRestDay();
    if (result) forceSync();
  }, [logRestDay, forceSync]);

  const handleCancelRestDay = useCallback(() => {
    Alert.alert(
      "Cancel Rest Day",
      "Are you sure you want to cancel your rest day?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Cancel Rest Day",
          style: "destructive",
          onPress: async () => {
            const syncedWorkoutId = cancelRestDay();
            if (syncedWorkoutId) {
              // Optimistically remove from query cache to prevent reconciliation re-adoption
              queryClient.setQueryData(
                ["workouts", 1, 20],
                (old: any[] | undefined) =>
                  old?.filter((w: any) => w.id !== syncedWorkoutId),
              );
              try {
                await (api.api.v1.workouts as any)[syncedWorkoutId].delete();
              } catch {
                // Best-effort
              }
            }
            queryClient.invalidateQueries({ queryKey: ["workouts"] });
            queryClient.invalidateQueries({ queryKey: ["streak"] });
            queryClient.invalidateQueries({ queryKey: ["all-time-stats"] });
          },
        },
      ],
    );
  }, [cancelRestDay, queryClient]);

  const isOnExerciseSlide = workout !== null && activeSlide < exerciseCount;

  // --- Rest day state ---
  if (!isActive && todayRestDay) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-zinc-900"
        edges={["top"]}
      >
        <View className="px-4 pb-2 pt-4">
          <Text className="text-3xl font-bold dark:text-zinc-100">
            Rest Day
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="bed-outline" size={64} color={colors.secondaryText} />
          <Text className="mt-4 mb-2 text-xl font-semibold dark:text-zinc-100">
            You're resting today
          </Text>
          <Text className="mb-6 text-center text-base text-zinc-500 dark:text-zinc-400">
            Recovery is part of the process.
          </Text>
          <Pressable
            onPress={handleCancelRestDay}
            className="w-full flex-row items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-800 py-3.5 active:bg-red-50 dark:active:bg-red-950"
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color={colors.dangerIcon}
            />
            <Text className="text-base font-semibold text-red-500 dark:text-red-400">
              Cancel Rest Day
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --- Idle state (no active workout) ---
  if (!isActive) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-zinc-900"
        edges={["top"]}
      >
        <View className="px-4 pb-2 pt-4">
          <Text className="text-3xl font-bold dark:text-zinc-100">Workout</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-xl font-semibold dark:text-zinc-100">
            Ready to train?
          </Text>
          <Text className="mb-6 text-center text-base text-zinc-500 dark:text-zinc-400">
            Start a new workout session to begin logging your exercises.
          </Text>
          <Pressable
            onPress={startWorkout}
            className="mb-3 w-full items-center rounded-lg bg-blue-500 py-3.5 active:bg-blue-600"
          >
            <Text className="text-base font-semibold text-white">
              Start Workout
            </Text>
          </Pressable>
          {!todayHasWorkouts && (
            <Pressable
              onPress={handleLogRestDay}
              className="w-full flex-row items-center justify-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-600 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
            >
              <Ionicons
                name="bed-outline"
                size={18}
                color={colors.secondaryText}
              />
              <Text className="text-base font-semibold text-zinc-600 dark:text-zinc-300">
                Log Rest Day
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // --- Active workout ---
  // workout is guaranteed non-null here since isActive is true
  if (!workout) return null;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-3 pb-2 pt-2">
        <View className="flex-row items-center gap-2">
          {/* Reorder button */}
          <Pressable
            onPress={() => setShowReorder(true)}
            className="h-9 w-9 items-center justify-center rounded-md active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <Ionicons
              name="reorder-four"
              size={22}
              color={colors.secondaryText}
            />
          </Pressable>
          {/* Remove current exercise button */}
          {isOnExerciseSlide && (
            <Pressable
              onPress={handleRemoveCurrentExercise}
              className="h-9 w-9 items-center justify-center rounded-md active:bg-red-50 dark:active:bg-red-950"
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.dangerIcon}
              />
            </Pressable>
          )}
        </View>

        {/* Timer */}
        <Text className="font-mono text-base font-semibold text-zinc-600 dark:text-zinc-300">
          {elapsedTime}
        </Text>

        <View className="flex-row items-center gap-2">
          {/* Cancel button */}
          <Pressable
            onPress={handleCancelWorkout}
            className="h-9 w-9 items-center justify-center rounded-md active:bg-red-50 dark:active:bg-red-950"
          >
            <Ionicons name="close" size={22} color={colors.dangerIcon} />
          </Pressable>
          {/* Finish button */}
          <Pressable
            onPress={handleFinish}
            className="h-9 w-9 items-center justify-center rounded-md active:bg-green-50 dark:active:bg-green-950"
          >
            <Ionicons name="checkmark" size={22} color={colors.successIcon} />
          </Pressable>
        </View>
      </View>

      {/* Slide indicator */}
      <View className="flex-row items-center justify-center gap-1 py-1.5">
        {workout.exercises.map((_, i) => (
          <View
            key={i}
            className="h-1.5 rounded-full"
            style={{
              width: i === activeSlide ? 16 : 6,
              backgroundColor:
                i === activeSlide
                  ? colors.activeIndicator
                  : colors.inactiveIndicator,
            }}
          />
        ))}
        <View
          className="h-1.5 rounded-full"
          style={{
            width: activeSlide === exerciseCount ? 16 : 6,
            backgroundColor:
              activeSlide === exerciseCount
                ? colors.activeIndicator
                : colors.inactiveIndicator,
          }}
        />
      </View>

      {/* PagerView */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {workout.exercises.map((exercise) => (
          <View
            key={exercise.exerciseId + (exercise.profileId || "")}
            collapsable={false}
          >
            <ExerciseSlide exercise={exercise} />
          </View>
        ))}
        <View key="add" collapsable={false}>
          <AddExerciseSlide onExerciseAdded={handleExerciseAdded} />
        </View>
      </PagerView>

      {/* Modals */}
      {workout && (
        <WorkoutSummary
          visible={showSummary}
          workout={workout}
          onSave={handleSave}
          onCancel={handleCancelSummary}
        />
      )}

      <ReorderModal
        visible={showReorder}
        onClose={() => setShowReorder(false)}
      />
    </SafeAreaView>
  );
}
