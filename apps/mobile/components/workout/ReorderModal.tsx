import { useCallback } from "react";
import { View, Text, Pressable, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWorkout } from "../../hooks/useWorkout";

interface ReorderModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReorderModal({ visible, onClose }: ReorderModalProps) {
  const { workout, reorderExercises } = useWorkout();

  const handleMoveUp = useCallback(
    (index: number) => {
      if (!workout || index <= 0) return;
      const exercises = [...workout.exercises];
      const [removed] = exercises.splice(index, 1);
      exercises.splice(index - 1, 0, removed);
      reorderExercises(exercises.map((e) => e.exerciseId));
    },
    [workout, reorderExercises],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (!workout || index >= workout.exercises.length - 1) return;
      const exercises = [...workout.exercises];
      const [removed] = exercises.splice(index, 1);
      exercises.splice(index + 1, 0, removed);
      reorderExercises(exercises.map((e) => e.exerciseId));
    },
    [workout, reorderExercises],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-zinc-200 px-4 pb-3 pt-4">
          <Text className="text-lg font-bold">Reorder Exercises</Text>
          <Pressable
            onPress={onClose}
            className="rounded-lg bg-blue-500 px-4 py-2 active:bg-blue-600"
          >
            <Text className="font-semibold text-white">Done</Text>
          </Pressable>
        </View>

        {/* Exercise list */}
        <ScrollView className="flex-1 px-4 pt-2">
          {workout?.exercises.map((exercise, index) => (
            <View
              key={exercise.exerciseId}
              className="mb-2 flex-row items-center rounded-lg border border-zinc-200 bg-zinc-50 p-3"
            >
              <View className="flex-1">
                <Text className="text-base font-medium">
                  {exercise.exerciseName}
                </Text>
                <Text className="text-sm text-zinc-400">
                  {exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}
                </Text>
              </View>

              <View className="flex-row gap-1">
                <Pressable
                  onPress={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="h-9 w-9 items-center justify-center rounded-md bg-zinc-200 active:bg-zinc-300"
                  style={{ opacity: index === 0 ? 0.3 : 1 }}
                >
                  <Ionicons name="chevron-up" size={20} color="#3f3f46" />
                </Pressable>
                <Pressable
                  onPress={() => handleMoveDown(index)}
                  disabled={
                    !workout || index === workout.exercises.length - 1
                  }
                  className="h-9 w-9 items-center justify-center rounded-md bg-zinc-200 active:bg-zinc-300"
                  style={{
                    opacity:
                      !workout || index === workout.exercises.length - 1
                        ? 0.3
                        : 1,
                  }}
                >
                  <Ionicons name="chevron-down" size={20} color="#3f3f46" />
                </Pressable>
              </View>
            </View>
          ))}

          {(!workout || workout.exercises.length === 0) && (
            <Text className="py-8 text-center text-zinc-400">
              No exercises to reorder
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
