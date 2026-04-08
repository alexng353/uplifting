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
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="border-b border-zinc-200 px-4 pb-3 pt-4">
          <Text className="text-xl font-bold">Workout Summary</Text>
        </View>

        <ScrollView className="flex-1 px-4 pt-4">
          {/* Workout Name */}
          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-zinc-500">
              Workout Name (optional)
            </Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                setUserHasEdited(true);
              }}
              placeholder="e.g., Push Day, Leg Day"
              className="rounded-lg border border-zinc-300 px-3 py-2.5 text-base"
              placeholderTextColor="#a1a1aa"
            />
          </View>

          {/* Gym Location */}
          <View className="mb-6">
            <Text className="mb-1 text-sm font-medium text-zinc-500">
              Gym Location (optional)
            </Text>
            <TextInput
              value={gymLocation}
              onChangeText={setGymLocation}
              placeholder="e.g., Downtown Gym"
              className="rounded-lg border border-zinc-300 px-3 py-2.5 text-base"
              placeholderTextColor="#a1a1aa"
            />
          </View>

          {/* Stats Grid */}
          <View className="mb-6 flex-row flex-wrap justify-center gap-4">
            <View className="items-center rounded-lg bg-zinc-100 px-5 py-3">
              <Text className="text-2xl font-bold">{duration}</Text>
              <Text className="text-xs uppercase text-zinc-400">Minutes</Text>
            </View>
            <View className="items-center rounded-lg bg-zinc-100 px-5 py-3">
              <Text className="text-2xl font-bold">
                {workout.exercises.length}
              </Text>
              <Text className="text-xs uppercase text-zinc-400">
                Exercises
              </Text>
            </View>
            <View className="items-center rounded-lg bg-zinc-100 px-5 py-3">
              <Text className="text-2xl font-bold">{totalSets}</Text>
              <Text className="text-xs uppercase text-zinc-400">Sets</Text>
            </View>
            <View className="items-center rounded-lg bg-zinc-100 px-5 py-3">
              <Text className="text-2xl font-bold">{totalReps}</Text>
              <Text className="text-xs uppercase text-zinc-400">Reps</Text>
            </View>
            <View className="items-center rounded-lg bg-zinc-100 px-5 py-3">
              <Text className="text-2xl font-bold">
                {Math.round(totalVolume).toLocaleString()}
              </Text>
              <Text className="text-xs uppercase text-zinc-400">
                Volume ({unit})
              </Text>
            </View>
          </View>

          {/* Exercises List */}
          <View className="mb-6">
            <Text className="mb-2 text-lg font-semibold">Exercises</Text>
            {workout.exercises.map((exercise) => (
              <View
                key={exercise.exerciseId}
                className="border-b border-zinc-100 py-2"
              >
                <Text className="text-base font-medium">
                  {exercise.exerciseName}
                </Text>
                <Text className="text-sm text-zinc-400">
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
        <View className="border-t border-zinc-200 px-4 pb-8 pt-3">
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
            className="items-center rounded-lg border border-zinc-300 py-3.5 active:bg-zinc-50"
          >
            <Text className="text-base font-semibold text-zinc-600">
              Continue Workout
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
