import { useCallback, useMemo } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import type { StoredWorkoutExercise } from "../../services/storage";
import { useWorkoutActions } from "../../hooks/useWorkoutActions";
import AddExerciseSlide, { type PickedExercise } from "./AddExerciseSlide";

interface SwapExerciseModalProps {
  visible: boolean;
  /** The exercise being replaced. Null closes/renders nothing. */
  exercise: StoredWorkoutExercise | null;
  onClose: () => void;
}

export default function SwapExerciseModal({ visible, exercise, onClose }: SwapExerciseModalProps) {
  const { workout, swapExercise } = useWorkoutActions();

  // Exercises already in the workout can't be swapped in: the workout is keyed
  // by exerciseId, so a duplicate would break set editing and reordering.
  // Includes the exercise being replaced — swapping it for itself is a no-op.
  const disabledExerciseIds = useMemo(
    () => new Set((workout?.exercises ?? []).map((e) => e.exerciseId)),
    [workout],
  );

  const handleSelect = useCallback(
    (picked: PickedExercise) => {
      if (!exercise) return;
      swapExercise(
        exercise.exerciseId,
        picked.exerciseId,
        picked.exerciseName,
        picked.profileId,
        picked.exerciseType,
      );
      onClose();
    },
    [exercise, swapExercise, onClose],
  );

  const setCount = exercise?.sets.length ?? 0;

  return (
    <Modal
      visible={visible && exercise !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white dark:bg-zinc-900">
        {/* Header */}
        <View className="border-b border-zinc-200 dark:border-zinc-700 px-4 pb-3 pt-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold dark:text-zinc-100">Swap Exercise</Text>
            <Pressable
              onPress={onClose}
              className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 active:bg-zinc-200 dark:active:bg-zinc-700"
            >
              <Text className="font-semibold text-zinc-600 dark:text-zinc-300">Cancel</Text>
            </Pressable>
          </View>
          <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Replacing {exercise?.exerciseName ?? ""} — its {setCount} set
            {setCount !== 1 ? "s" : ""} and position are kept.
          </Text>
        </View>

        <AddExerciseSlide
          title={null}
          onSelectExercise={handleSelect}
          disabledExerciseIds={disabledExerciseIds}
          disabledLabel="In workout"
        />
      </View>
    </Modal>
  );
}
