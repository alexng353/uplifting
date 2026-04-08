import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";
import { useSettings } from "../../hooks/useSettings";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useWorkoutTitleSuggestion } from "../../hooks/useWorkoutTitleSuggestion";
import {
  getCurrentGymId,
  getGyms,
  type StoredWorkout,
} from "../../services/storage";

interface WorkoutSummaryProps {
  visible: boolean;
  workout: StoredWorkout;
  onSave: (name?: string, gymLocation?: string) => void;
  onCancel: () => void;
}

export default function WorkoutSummary({
  visible,
  workout,
  onSave,
  onCancel,
}: WorkoutSummaryProps) {
  const { formatWeight, getDisplayUnit } = useSettings();
  const colors = useThemeColors();
  const unit = getDisplayUnit();
  const suggestedTitle = useWorkoutTitleSuggestion();
  const [name, setName] = useState(workout.name ?? "");
  const [gymLocation, setGymLocation] = useState(workout.gymLocation ?? "");
  const [userHasEdited, setUserHasEdited] = useState(false);

  // Pre-fill with suggested title once loaded (if user hasn't typed yet)
  useEffect(() => {
    if (suggestedTitle && !userHasEdited && name === "") {
      setName(suggestedTitle);
    }
  }, [suggestedTitle, userHasEdited, name]);

  // Auto-fill gym location from detected nearby gym on mount
  useEffect(() => {
    if (workout.gymLocation) return;
    const gymId = getCurrentGymId();
    if (!gymId) return;
    const gyms = getGyms();
    const gym = gyms.find((g) => g.id === gymId);
    if (gym) setGymLocation(gym.name);
  }, [workout.gymLocation]);

  const handleSave = useCallback(() => {
    onSave(name || undefined, gymLocation || undefined);
  }, [name, gymLocation, onSave]);

  // Calculate stats
  const totalSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0,
  );
  const totalReps = workout.exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + (set.reps ?? 0), 0),
    0,
  );
  const totalVolume = workout.exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets.reduce((s, set) => s + (set.reps ?? 0) * (set.weight ?? 0), 0),
    0,
  );
  const duration = Math.round(
    (Date.now() - new Date(workout.startTime).getTime()) / 60000,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-white dark:bg-zinc-900">
        {/* Header */}
        <View className="border-b border-zinc-200 dark:border-zinc-700 px-4 pb-3 pt-4">
          <Text className="text-xl font-bold dark:text-zinc-100">Workout Summary</Text>
        </View>

        <ScrollView className="flex-1 px-4 pt-4">
          {/* Workout Name */}
          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Workout Name (optional)
            </Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                setUserHasEdited(true);
              }}
              placeholder="e.g., Push Day, Leg Day"
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2.5 text-base dark:text-zinc-100"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          {/* Gym Location */}
          <View className="mb-6">
            <Text className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Gym Location (optional)
            </Text>
            <TextInput
              value={gymLocation}
              onChangeText={setGymLocation}
              placeholder="e.g., Downtown Gym"
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2.5 text-base dark:text-zinc-100"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          {/* Stats Grid */}
          <View className="mb-6 flex-row flex-wrap justify-center gap-4">
            <View className="items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 px-5 py-3">
              <Text className="text-2xl font-bold dark:text-zinc-100">{duration}</Text>
              <Text className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Minutes</Text>
            </View>
            <View className="items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 px-5 py-3">
              <Text className="text-2xl font-bold dark:text-zinc-100">
                {workout.exercises.length}
              </Text>
              <Text className="text-xs uppercase text-zinc-400 dark:text-zinc-500">
                Exercises
              </Text>
            </View>
            <View className="items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 px-5 py-3">
              <Text className="text-2xl font-bold dark:text-zinc-100">{totalSets}</Text>
              <Text className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Sets</Text>
            </View>
            <View className="items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 px-5 py-3">
              <Text className="text-2xl font-bold dark:text-zinc-100">{totalReps}</Text>
              <Text className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Reps</Text>
            </View>
            <View className="items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 px-5 py-3">
              <Text className="text-2xl font-bold dark:text-zinc-100">
                {Math.round(totalVolume).toLocaleString()}
              </Text>
              <Text className="text-xs uppercase text-zinc-400 dark:text-zinc-500">
                Volume ({unit})
              </Text>
            </View>
          </View>

          {/* Exercises List */}
          <View className="mb-6">
            <Text className="mb-2 text-lg font-semibold dark:text-zinc-100">Exercises</Text>
            {workout.exercises.map((exercise) => (
              <View
                key={exercise.exerciseId}
                className="border-b border-zinc-100 dark:border-zinc-800 py-2"
              >
                <Text className="text-base font-medium dark:text-zinc-100">
                  {exercise.exerciseName}
                </Text>
                <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                  {exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}{" "}
                  {exercise.sets
                    .filter((s) => s.reps != null)
                    .map(
                      (s) =>
                        `${s.reps}x${formatWeight(s.weight ?? 0, s.weightUnit)}`,
                    )
                    .join(", ")}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View className="border-t border-zinc-200 dark:border-zinc-700 px-4 pb-8 pt-3">
          <Pressable
            onPress={handleSave}
            className="mb-2 items-center rounded-lg bg-blue-500 py-3.5 active:bg-blue-600"
          >
            <Text className="text-base font-semibold text-white">
              Save Workout
            </Text>
          </Pressable>
          <Pressable
            onPress={onCancel}
            className="items-center rounded-lg border border-zinc-300 dark:border-zinc-600 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
          >
            <Text className="text-base font-semibold text-zinc-600 dark:text-zinc-300">
              Continue Workout
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
