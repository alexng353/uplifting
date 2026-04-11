import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import PagerView from "react-native-pager-view";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../../../../../hooks/useThemeColors";
import { EditWorkoutProvider } from "../../../../../hooks/useEditWorkout";
import { useWorkoutActions, useEditWorkoutMeta } from "../../../../../hooks/useWorkoutActions";
import ExerciseSlide from "../../../../../components/workout/ExerciseSlide";
import AddExerciseSlide from "../../../../../components/workout/AddExerciseSlide";
import ReorderModal from "../../../../../components/workout/ReorderModal";

// ─── Page 0: Workout Details Form ───────────────────────────────────────────

interface WorkoutDetailsPageProps {
  onDelete: () => void;
}

function WorkoutDetailsPage({ onDelete }: WorkoutDetailsPageProps) {
  const colors = useThemeColors();
  const meta = useEditWorkoutMeta();
  const workout = meta.workout;

  // Local form state — avoids re-rendering PagerView on every keystroke
  const [name, setName] = useState(workout?.name ?? "");
  const [gymLocation, setGymLocation] = useState(workout?.gymLocation ?? "");
  const [startTime, setStartTime] = useState(
    workout?.startTime ? new Date(workout.startTime) : new Date(),
  );
  const [endTime, setEndTime] = useState(
    workout?.endTime ? new Date(workout.endTime) : new Date(),
  );

  // Derive duration in minutes from startTime/endTime
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  const [durationText, setDurationText] = useState(String(Math.max(0, duration)));

  // Sync local state → workout context using functional updater
  // to avoid capturing stale workout state (exercise mutations
  // happen on other pages while this stays mounted in PagerView)
  useEffect(() => {
    meta.setWorkout((prev) => ({
      ...prev,
      name: name || undefined,
      gymLocation: gymLocation || undefined,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, gymLocation, startTime, endTime]);

  // When startTime changes, keep endTime fixed and recalculate duration
  const handleStartTimeChange = useCallback(
    (_: unknown, date?: Date) => {
      if (!date) return;
      setStartTime(date);
      // endTime stays fixed; duration recalculates
      const newDuration = Math.round((endTime.getTime() - date.getTime()) / 60000);
      setDurationText(String(Math.max(0, newDuration)));
    },
    [endTime],
  );

  // When endTime changes, recalculate duration
  const handleEndTimeChange = useCallback(
    (_: unknown, date?: Date) => {
      if (!date) return;
      setEndTime(date);
      const newDuration = Math.round((date.getTime() - startTime.getTime()) / 60000);
      setDurationText(String(Math.max(0, newDuration)));
    },
    [startTime],
  );

  // When duration is manually edited, update endTime = startTime + duration * 60000
  const handleDurationChange = useCallback(
    (text: string) => {
      setDurationText(text);
      const mins = parseInt(text, 10);
      if (!isNaN(mins) && mins >= 0) {
        const newEnd = new Date(startTime.getTime() + mins * 60000);
        setEndTime(newEnd);
      }
    },
    [startTime],
  );


  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-900"
      contentContainerClassName="pb-12"
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-4 pt-4">
        {/* Name */}
        <Text className="mb-1 text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
          Workout Name
        </Text>
        <TextInput
          className="mb-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-base dark:text-zinc-100"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Morning Push"
          placeholderTextColor={colors.placeholder}
          returnKeyType="done"
        />

        {/* Gym Location */}
        <Text className="mb-1 text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
          Gym Location
        </Text>
        <TextInput
          className="mb-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-base dark:text-zinc-100"
          value={gymLocation}
          onChangeText={setGymLocation}
          placeholder="e.g. Gold's Gym"
          placeholderTextColor={colors.placeholder}
          returnKeyType="done"
        />

        {/* Start Time */}
        <Text className="mb-1 text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
          Start Time
        </Text>
        <View className="mb-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-1">
          <DateTimePicker
            value={startTime}
            mode="datetime"
            display="default"
            onChange={handleStartTimeChange}
            textColor={colors.primaryText}
          />
        </View>

        {/* End Time */}
        <Text className="mb-1 text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
          End Time
        </Text>
        <View className="mb-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-1">
          <DateTimePicker
            value={endTime}
            mode="datetime"
            display="default"
            onChange={handleEndTimeChange}
            textColor={colors.primaryText}
          />
        </View>

        {/* Duration (minutes) */}
        <Text className="mb-1 text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
          Duration (minutes)
        </Text>
        <TextInput
          className="mb-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-base dark:text-zinc-100"
          value={durationText}
          onChangeText={handleDurationChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.placeholder}
          returnKeyType="done"
        />

        {/* Delete button */}
        <Pressable
          onPress={onDelete}
          className="flex-row items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-800 py-3.5 active:bg-red-50 dark:active:bg-red-950"
        >
          <Ionicons name="trash-outline" size={18} color={colors.dangerIcon} />
          <Text className="text-base font-semibold text-red-500 dark:text-red-400">
            Delete Workout
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── EditWorkoutContent ──────────────────────────────────────────────────────

function EditWorkoutContent() {
  const router = useRouter();
  const colors = useThemeColors();
  const { workout } = useWorkoutActions();
  const meta = useEditWorkoutMeta();

  const pagerRef = useRef<PagerView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showReorder, setShowReorder] = useState(false);

  const exerciseCount = workout?.exercises.length ?? 0;
  // Slide 0 = details, slides 1..exerciseCount = exercises, slide exerciseCount+1 = add

  // Clamp when exercises are removed
  useEffect(() => {
    const maxIndex = exerciseCount + 1; // last valid slide (add-exercise)
    if (activeSlide > maxIndex) {
      pagerRef.current?.setPage(maxIndex);
      setActiveSlide(maxIndex);
    }
  }, [exerciseCount, activeSlide]);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setActiveSlide(e.nativeEvent.position);
    },
    [],
  );

  const handleExerciseAdded = useCallback(() => {
    if (!workout) return;
    // New exercise is appended; navigate to it (1 for details + new exercise index)
    const newIndex = 1 + workout.exercises.length;
    setTimeout(() => pagerRef.current?.setPage(newIndex), 100);
  }, [workout]);

  const handleRemoveCurrentExercise = useCallback(() => {
    if (!workout) return;
    // activeSlide 0 is details, so exercise index = activeSlide - 1
    const exerciseIndex = activeSlide - 1;
    const exercise = workout.exercises[exerciseIndex];
    if (!exercise) return;
    Alert.alert(
      "Remove Exercise",
      `Remove ${exercise.exerciseName} from this workout?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => meta.actions?.removeExercise(exercise.exerciseId),
        },
      ],
    );
  }, [workout, activeSlide, meta.actions]);

  const handleBack = useCallback(() => {
    if (meta.hasChanges) {
      Alert.alert(
        "Discard Changes",
        "You have unsaved changes. Discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  }, [meta.hasChanges, router]);

  const handleSave = useCallback(async () => {
    try {
      await meta.save();
      // Navigate back twice: past this screen and the now-stale details screen
      router.back();
      router.back();
    } catch {
      Alert.alert(
        "Save Failed",
        "Could not save workout. Please try again.",
      );
    }
  }, [meta, router]);

  const handleDeleteAndNavigate = useCallback(() => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to delete this workout? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await meta.deleteWorkout();
              router.back();
              router.back();
            } catch {
              Alert.alert(
                "Delete Failed",
                "Could not delete workout. Please try again.",
              );
            }
          },
        },
      ],
    );
  }, [meta, router]);

  // isOnExerciseSlide: true when viewing one of the exercise slides (not details, not add)
  const isOnExerciseSlide = activeSlide >= 1 && activeSlide <= exerciseCount;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900" edges={["top"]}>
      {/* Red "Editing Workout" banner */}
      <View className="items-center bg-red-500 py-1">
        <Text className="text-xs font-semibold text-white">Editing Workout</Text>
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-3 pb-2 pt-2">
        {/* Left: back + reorder + remove */}
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={handleBack}
            className="h-9 w-9 items-center justify-center rounded-md active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <Ionicons name="chevron-back" size={22} color={colors.secondaryText} />
          </Pressable>

          <Pressable
            onPress={() => setShowReorder(true)}
            className="h-9 w-9 items-center justify-center rounded-md active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <Ionicons name="reorder-four" size={22} color={colors.secondaryText} />
          </Pressable>

          {isOnExerciseSlide && (
            <Pressable
              onPress={handleRemoveCurrentExercise}
              className="h-9 w-9 items-center justify-center rounded-md active:bg-red-50 dark:active:bg-red-950"
            >
              <Ionicons name="trash-outline" size={20} color={colors.dangerIcon} />
            </Pressable>
          )}
        </View>

        {/* Right: save */}
        <Pressable
          onPress={handleSave}
          disabled={meta.isSaving}
          className="h-9 px-4 items-center justify-center rounded-md bg-blue-500 active:bg-blue-600"
          style={{ opacity: meta.isSaving ? 0.5 : 1 }}
        >
          <Text className="text-sm font-semibold text-white">
            {meta.isSaving ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>

      {/* Slide indicator dots: 1 detail + exercises + 1 add */}
      <View className="flex-row items-center justify-center gap-1 py-1.5">
        {/* Details dot (index 0) */}
        <View
          className="h-1.5 rounded-full"
          style={{
            width: activeSlide === 0 ? 16 : 6,
            backgroundColor:
              activeSlide === 0 ? colors.activeIndicator : colors.inactiveIndicator,
          }}
        />
        {/* Exercise dots (indices 1..exerciseCount) */}
        {workout?.exercises.map((_, i) => (
          <View
            key={i}
            className="h-1.5 rounded-full"
            style={{
              width: activeSlide === i + 1 ? 16 : 6,
              backgroundColor:
                activeSlide === i + 1
                  ? colors.activeIndicator
                  : colors.inactiveIndicator,
            }}
          />
        ))}
        {/* Add-exercise dot (index exerciseCount+1) */}
        <View
          className="h-1.5 rounded-full"
          style={{
            width: activeSlide === exerciseCount + 1 ? 16 : 6,
            backgroundColor:
              activeSlide === exerciseCount + 1
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
        {/* Page 0: Details */}
        <View key="details" collapsable={false}>
          <WorkoutDetailsPage onDelete={handleDeleteAndNavigate} />
        </View>

        {/* Pages 1..n: Exercises */}
        {workout?.exercises.map((exercise) => (
          <View
            key={exercise.exerciseId + (exercise.profileId ?? "")}
            collapsable={false}
          >
            <ExerciseSlide exercise={exercise} />
          </View>
        ))}

        {/* Page n+1: Add Exercise */}
        <View key="add" collapsable={false}>
          <AddExerciseSlide onExerciseAdded={handleExerciseAdded} />
        </View>
      </PagerView>

      <ReorderModal
        visible={showReorder}
        onClose={() => setShowReorder(false)}
      />
    </SafeAreaView>
  );
}

// ─── EditWorkoutScreen (default export) ─────────────────────────────────────

export default function EditWorkoutScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  if (!workoutId) return null;

  return (
    <EditWorkoutProvider workoutId={workoutId}>
      <EditWorkoutContent />
    </EditWorkoutProvider>
  );
}
