import { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardToolbar } from "react-native-keyboard-controller";
import { useWorkoutActions } from "../../hooks/useWorkoutActions";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useSettings } from "../../hooks/useSettings";
import { usePreviousSets } from "../../hooks/usePreviousSets";
import { useExerciseProfiles } from "../../hooks/useExerciseProfiles";
import { useGymProfileSuggestion } from "../../hooks/useGymProfileSuggestion";
import type { StoredSet, StoredWorkoutExercise } from "../../services/storage";
import RestTimer from "./RestTimer";

interface ExerciseSlideProps {
  exercise: StoredWorkoutExercise;
}

interface SetPair {
  setNumber: number;
  rightSet?: StoredSet;
  leftSet?: StoredSet;
}

const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = 20;

const INPUT_HEIGHT = 36;
const SIDE_BADGE_HEIGHT = 22;

function SetRow({
  set,
  setNumber,
  sideLabel,
  exerciseId,
  displayUnit,
  updateSet,
  suggestedReps,
  suggestedWeight,
  isBodyweight,
}: {
  set: StoredSet;
  setNumber: number;
  sideLabel?: "R" | "L";
  exerciseId: string;
  displayUnit: string;
  updateSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<StoredSet>,
  ) => void;
  suggestedReps: number;
  suggestedWeight: number;
  isBodyweight?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View className="mb-1 flex-row items-center gap-2 px-2 py-1">
      <Text className="w-8 text-center text-sm font-medium text-zinc-400 dark:text-zinc-500">
        {sideLabel === "L" ? "" : String(setNumber)}
      </Text>
      {sideLabel != null && (
        <View
          className="w-7 items-center justify-center rounded"
          style={{
            height: SIDE_BADGE_HEIGHT,
            backgroundColor: sideLabel === "R" ? colors.rightSideBg : colors.leftSideBg,
          }}
        >
          <Text
            className="text-xs font-bold"
            style={{ color: sideLabel === "R" ? colors.rightSideText : colors.leftSideText }}
          >
            {sideLabel}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <TextInput
          keyboardType="numeric"
          value={set.reps != null ? String(set.reps) : ""}
          placeholder={String(suggestedReps)}
          placeholderTextColor={colors.placeholder}
          onChangeText={(text) =>
            updateSet(exerciseId, set.id, {
              reps: text ? Number(text) : undefined,
            })
          }
          className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-center dark:text-zinc-100"
          style={{ height: INPUT_HEIGHT, fontSize: 16, textAlignVertical: "center" }}
          selectTextOnFocus
        />
      </View>
      {isBodyweight && (
        <Text className="text-xs text-zinc-400 dark:text-zinc-500">BW +</Text>
      )}
      <View className="flex-1">
        <TextInput
          keyboardType="numeric"
          value={set.weight != null ? String(set.weight) : ""}
          placeholder={String(suggestedWeight)}
          placeholderTextColor={colors.placeholder}
          onChangeText={(text) =>
            updateSet(exerciseId, set.id, {
              weight: text ? Number(text) : undefined,
            })
          }
          className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-center dark:text-zinc-100"
          style={{ height: INPUT_HEIGHT, fontSize: 16, textAlignVertical: "center" }}
          selectTextOnFocus
        />
      </View>
      <Text className="w-8 text-xs text-zinc-400 dark:text-zinc-500">{displayUnit}</Text>
    </View>
  );
}

export default function ExerciseSlide({ exercise }: ExerciseSlideProps) {
  const {
    addSet,
    addUnilateralPair,
    updateSet,
    toggleUnilateral,
    removeLastSet,
    removeLastUnilateralPair,
    changeExerciseProfile,
  } = useWorkoutActions();
  const colors = useThemeColors();
  const { getDisplayUnit } = useSettings();
  const { getSuggestion } = usePreviousSets();
  const { data: profiles = [] } = useExerciseProfiles(exercise.exerciseId);
  const { getSuggestedProfile, recordProfileUsage, currentGymId } =
    useGymProfileSuggestion();
  const isBodyweight = exercise.exerciseType === "Bodyweight";
  const scrollRef = useRef<ScrollView>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);


  const displayUnit = getDisplayUnit();

  // Group sets into pairs for unilateral mode
  const setGroups = useMemo((): SetPair[] => {
    if (!exercise.isUnilateral) {
      return exercise.sets.map((set, index) => ({
        setNumber: index + 1,
        rightSet: set,
      }));
    }

    const pairs: SetPair[] = [];
    const rightSets = exercise.sets.filter((s) => s.side === "R");
    const leftSets = exercise.sets.filter((s) => s.side === "L");
    const maxLen = Math.max(rightSets.length, leftSets.length);

    for (let i = 0; i < maxLen; i++) {
      pairs.push({
        setNumber: i + 1,
        rightSet: rightSets[i],
        leftSet: leftSets[i],
      });
    }

    return pairs;
  }, [exercise.sets, exercise.isUnilateral]);

  const handleAddSet = useCallback(() => {
    if (exercise.isUnilateral) {
      addUnilateralPair(exercise.exerciseId, displayUnit);
    } else {
      addSet(exercise.exerciseId, displayUnit);
    }
    // Scroll to bottom after add
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [exercise.exerciseId, exercise.isUnilateral, addSet, addUnilateralPair, displayUnit]);

  const lastSet = exercise.sets[exercise.sets.length - 1];
  const lastRightSet = exercise.isUnilateral
    ? exercise.sets.filter((s) => s.side === "R").slice(-1)[0]
    : null;

  const handleDuplicateLastSet = useCallback(() => {
    if (exercise.isUnilateral) {
      if (!lastRightSet) return;
      addUnilateralPair(
        exercise.exerciseId,
        lastRightSet.weightUnit,
        lastRightSet.reps ?? DEFAULT_REPS,
        lastRightSet.weight ?? DEFAULT_WEIGHT,
      );
    } else {
      if (!lastSet) return;
      addSet(
        exercise.exerciseId,
        lastSet.weightUnit,
        lastSet.reps ?? DEFAULT_REPS,
        lastSet.weight ?? DEFAULT_WEIGHT,
      );
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [
    exercise.exerciseId,
    exercise.isUnilateral,
    lastSet,
    lastRightSet,
    addSet,
    addUnilateralPair,
  ]);

  const handleRemoveLastSet = useCallback(() => {
    if (exercise.isUnilateral) {
      removeLastUnilateralPair(exercise.exerciseId);
    } else {
      removeLastSet(exercise.exerciseId);
    }
  }, [
    exercise.exerciseId,
    exercise.isUnilateral,
    removeLastSet,
    removeLastUnilateralPair,
  ]);

  const handleToggleUnilateral = useCallback(() => {
    toggleUnilateral(exercise.exerciseId);
  }, [exercise.exerciseId, toggleUnilateral]);

  // Extract base exercise name (without profile suffix)
  const baseName = useMemo(() => {
    if (exercise.profileId) {
      return exercise.exerciseName.replace(/\s*\([^)]+\)$/, "");
    }
    return exercise.exerciseName;
  }, [exercise.exerciseName, exercise.profileId]);

  const handleChangeProfile = useCallback(
    (profileId?: string, profileName?: string) => {
      const displayName = profileName
        ? `${baseName} (${profileName})`
        : baseName;
      changeExerciseProfile(exercise.exerciseId, profileId, displayName);

      if (profileId) {
        recordProfileUsage(exercise.exerciseId, profileId);
      }

      setShowProfileModal(false);
    },
    [exercise.exerciseId, baseName, changeExerciseProfile, recordProfileUsage],
  );

  const hasProfiles = profiles.length > 0;
  const canRemove = exercise.isUnilateral
    ? setGroups.length > 1
    : exercise.sets.length > 1;
  const canDuplicate = exercise.sets.length > 0;

  const suggestedProfileId = getSuggestedProfile(exercise.exerciseId);

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900 px-3 pt-2">
      {/* Header */}
      <View className="mb-2">
        <Pressable
          onPress={hasProfiles ? () => setShowProfileModal(true) : undefined}
          disabled={!hasProfiles}
        >
          <Text className="text-xl font-bold dark:text-zinc-100">
            {exercise.exerciseName}
            {hasProfiles && (
              <Text className="text-blue-500"> ...</Text>
            )}
          </Text>
        </Pressable>
        {exercise.exerciseType && (
          <View className="mt-1 flex-row items-center gap-2">
            <View className="items-center justify-center rounded bg-zinc-200 dark:bg-zinc-700 px-2" style={{ height: SIDE_BADGE_HEIGHT }}>
              <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {exercise.exerciseType}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">Unilateral</Text>
              <Switch
                value={exercise.isUnilateral ?? false}
                onValueChange={handleToggleUnilateral}
                trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
                thumbColor={exercise.isUnilateral ? colors.switchThumbOn : colors.switchThumbOff}
              />
            </View>
          </View>
        )}
      </View>

      {/* Set Table Header */}
      <View className="mb-1 flex-row items-center gap-2 px-2">
        <Text className="w-8 text-center text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
          Set
        </Text>
        {exercise.isUnilateral && (
          <Text className="w-7 text-center text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
            Side
          </Text>
        )}
        <Text className="flex-1 text-center text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
          Reps
        </Text>
        {isBodyweight && <Text className="text-xs text-transparent">BW +</Text>}
        <Text className="flex-1 text-center text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
          Weight
        </Text>
        <Text className="w-8 text-xs text-transparent">kg</Text>
      </View>

      {/* Sets */}
      <ScrollView ref={scrollRef} className="flex-1" keyboardShouldPersistTaps="handled">
        {exercise.isUnilateral
          ? setGroups.map((group) => {
              const rightSuggestion = getSuggestion(
                exercise.exerciseId,
                exercise.profileId,
                group.setNumber,
                "R",
              );
              const leftSuggestion = getSuggestion(
                exercise.exerciseId,
                exercise.profileId,
                group.setNumber,
                "L",
              );
              return (
                <View key={group.setNumber}>
                  {group.rightSet && (
                    <SetRow
                      set={group.rightSet}
                      setNumber={group.setNumber}
                      sideLabel="R"
                      exerciseId={exercise.exerciseId}
                      displayUnit={displayUnit}
                      updateSet={updateSet}
                      suggestedReps={rightSuggestion.reps ?? DEFAULT_REPS}
                      suggestedWeight={
                        rightSuggestion.weight ??
                        (isBodyweight ? 0 : DEFAULT_WEIGHT)
                      }
                      isBodyweight={isBodyweight}
                    />
                  )}
                  {group.leftSet && (
                    <SetRow
                      set={group.leftSet}
                      setNumber={group.setNumber}
                      sideLabel="L"
                      exerciseId={exercise.exerciseId}
                      displayUnit={displayUnit}
                      updateSet={updateSet}
                      suggestedReps={leftSuggestion.reps ?? DEFAULT_REPS}
                      suggestedWeight={
                        leftSuggestion.weight ??
                        (isBodyweight ? 0 : DEFAULT_WEIGHT)
                      }
                      isBodyweight={isBodyweight}
                    />
                  )}
                </View>
              );
            })
          : exercise.sets.map((set, index) => {
              const suggestion = getSuggestion(
                exercise.exerciseId,
                exercise.profileId,
                index + 1,
              );
              return (
                <SetRow
                  key={set.id}
                  set={set}
                  setNumber={index + 1}
                  exerciseId={exercise.exerciseId}
                  displayUnit={displayUnit}
                  updateSet={updateSet}
                  suggestedReps={suggestion.reps ?? DEFAULT_REPS}
                  suggestedWeight={
                    suggestion.weight ?? (isBodyweight ? 0 : DEFAULT_WEIGHT)
                  }
                  isBodyweight={isBodyweight}
                />
              );
            })}
      </ScrollView>

      {/* Rest Timer */}
      <RestTimer />

      {/* Action Buttons */}
      <View className="flex-row justify-center gap-3 pb-2 pt-1">
        <Pressable
          onPress={handleAddSet}
          className="h-10 w-10 items-center justify-center rounded-full border border-blue-500 active:bg-blue-50"
        >
          <Ionicons name="add" size={22} color={colors.accentIcon} />
        </Pressable>
        <Pressable
          onPress={handleDuplicateLastSet}
          disabled={!canDuplicate}
          className="h-10 w-10 items-center justify-center rounded-full border border-zinc-400 active:bg-zinc-50 dark:active:bg-zinc-800"
          style={{ opacity: canDuplicate ? 1 : 0.3 }}
        >
          <Ionicons name="copy-outline" size={18} color={colors.secondaryText} />
        </Pressable>
        <Pressable
          onPress={handleRemoveLastSet}
          disabled={!canRemove}
          className="h-10 w-10 items-center justify-center rounded-full border border-red-400 active:bg-red-50 dark:active:bg-red-950"
          style={{ opacity: canRemove ? 1 : 0.3 }}
        >
          <Ionicons name="remove" size={22} color={colors.dangerIcon} />
        </Pressable>
      </View>

      {/* Profile Selector Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View className="flex-1 bg-white dark:bg-zinc-900">
          <View className="flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-4 pb-3 pt-4">
            <Text className="text-lg font-bold dark:text-zinc-100">
              Profile for {baseName}
            </Text>
            <Pressable
              onPress={() => setShowProfileModal(false)}
              className="rounded-lg px-3 py-1.5 active:bg-zinc-100 dark:active:bg-zinc-800"
            >
              <Text className="text-base font-medium text-blue-500">
                Cancel
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={[
              { id: undefined, name: "Default (no profile)" },
              ...profiles.map((p: any) => ({
                id: p.id as string,
                name:
                  p.id === suggestedProfileId && currentGymId
                    ? `${p.name} (last used here)`
                    : (p.name as string),
              })),
            ]}
            keyExtractor={(item) => item.id ?? "default"}
            renderItem={({ item }) => {
              const isCurrent =
                item.id === exercise.profileId ||
                (item.id === undefined && !exercise.profileId);
              return (
                <Pressable
                  onPress={() => handleChangeProfile(item.id, item.id ? item.name : undefined)}
                  className="flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
                >
                  <Text className="text-base dark:text-zinc-100">{item.name}</Text>
                  {isCurrent && (
                    <Ionicons name="checkmark" size={20} color={colors.accentIcon} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>

      <KeyboardToolbar />
    </View>
  );
}
