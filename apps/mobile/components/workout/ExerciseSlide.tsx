import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useWorkoutActions } from "../../hooks/useWorkoutActions";
import { KEYBOARD_BAR_HEIGHT, useSetFieldFocus } from "../../hooks/useSetFieldFocus";
import { setFieldKey } from "../../lib/set-field-order";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useSettings } from "../../hooks/useSettings";
import { usePreviousSets } from "../../hooks/usePreviousSets";
import {
  useCreateExerciseProfile,
  useExerciseProfiles,
  useRenameExerciseProfile,
} from "../../hooks/useExerciseProfiles";
import { exerciseTitle, stripProfileSuffix, withoutPickerHint } from "../../lib/profile-names";
import { useExerciseNotes, useSetExerciseNote } from "../../hooks/useExerciseNotes";
import { useGymProfileSuggestion } from "../../hooks/useGymProfileSuggestion";
import type { SetSuggestion } from "../../lib/previous-sets";
import { SIDE_MODES, sideModeOf } from "../../lib/side-mode";
import { convertWeight } from "../../lib/units";
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
const ACCEPT_BUTTON_SIZE = 36;
const TARGET_RING_SIZE = 26;

function isRowDone(set: StoredSet, isBodyweight?: boolean): boolean {
  return set.reps != null && (isBodyweight || set.weight != null);
}

/** What a row can copy from history, in its own unit; defaults stay hints. */
function acceptValues(set: StoredSet, suggestion: SetSuggestion, isBodyweight?: boolean) {
  const acceptReps = suggestion.reps ?? undefined;
  const acceptWeight =
    suggestion.weight != null
      ? convertWeight(suggestion.weight, suggestion.weightUnit ?? set.weightUnit, set.weightUnit)
      : isBodyweight && acceptReps != null
        ? 0
        : undefined;
  // Fill only the empty fields so a value typed by hand is never overwritten.
  const updates: Partial<StoredSet> = {};
  if (set.reps == null && acceptReps != null) updates.reps = acceptReps;
  if (set.weight == null && acceptWeight != null) updates.weight = acceptWeight;
  return {
    updates,
    canAccept: Object.keys(updates).length > 0,
    isFilled: set.reps != null && set.weight != null,
    suggestedReps: acceptReps ?? DEFAULT_REPS,
    suggestedWeight: acceptWeight ?? (isBodyweight ? 0 : DEFAULT_WEIGHT),
  };
}

function SetNumberCell({
  setNumber,
  label,
  isTarget,
  ringDone,
}: {
  setNumber: number;
  label: string;
  isTarget?: boolean;
  ringDone: boolean;
}) {
  const colors = useThemeColors();
  if (!isTarget) {
    return (
      <Text className="w-8 text-center text-sm font-medium text-zinc-400 dark:text-zinc-500">
        {label}
      </Text>
    );
  }
  return (
    <View className="w-8 items-center">
      <View
        testID="target-set"
        accessibilityLabel={`Set ${setNumber}, your usual last set${ringDone ? ", done" : ""}`}
        className="items-center justify-center rounded-full"
        style={{
          width: TARGET_RING_SIZE,
          height: TARGET_RING_SIZE,
          borderWidth: 2,
          borderColor: ringDone ? colors.successIcon : colors.targetSet,
        }}
      >
        <Text
          className="text-sm font-bold"
          style={{ color: ringDone ? colors.successIcon : colors.targetSet }}
        >
          {String(setNumber)}
        </Text>
      </View>
    </View>
  );
}

function AcceptButton({
  setNumber,
  isFilled,
  canAccept,
  label,
  onPress,
}: {
  setNumber: number;
  isFilled: boolean;
  canAccept: boolean;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      testID="accept-suggestion"
      accessibilityRole="button"
      accessibilityLabel={
        isFilled ? `Set ${setNumber} filled` : canAccept ? label : `No previous set to copy`
      }
      accessibilityState={{ disabled: !canAccept }}
      disabled={!canAccept}
      onPress={onPress}
      hitSlop={6}
      className={`items-center justify-center rounded-full ${
        isFilled
          ? "bg-green-500/15"
          : canAccept
            ? "border border-zinc-300 dark:border-zinc-600 active:bg-zinc-200 dark:active:bg-zinc-700"
            : "opacity-30"
      }`}
      style={{ width: ACCEPT_BUTTON_SIZE, height: ACCEPT_BUTTON_SIZE }}
    >
      <Ionicons
        name="checkmark"
        size={20}
        color={isFilled ? colors.successIcon : colors.placeholder}
      />
    </Pressable>
  );
}

const INPUT_CLASS =
  "rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1 text-center dark:text-zinc-100";

/** Unilateral layout: one row per set, L reps/weight then R reps/weight. */
function PairRow({
  leftSet,
  rightSet,
  setNumber,
  exerciseId,
  displayUnit,
  updateSet,
  onAccept,
  onBlur,
  leftSuggestion,
  rightSuggestion,
  isBodyweight,
  isTarget,
}: {
  leftSet: StoredSet;
  rightSet: StoredSet;
  setNumber: number;
  exerciseId: string;
  displayUnit: string;
  updateSet: (exerciseId: string, setId: string, updates: Partial<StoredSet>) => void;
  onAccept: (left: Partial<StoredSet>, right: Partial<StoredSet>) => void;
  onBlur?: () => void;
  leftSuggestion: SetSuggestion;
  rightSuggestion: SetSuggestion;
  isBodyweight?: boolean;
  isTarget?: boolean;
}) {
  const colors = useThemeColors();
  const left = acceptValues(leftSet, leftSuggestion, isBodyweight);
  const right = acceptValues(rightSet, rightSuggestion, isBodyweight);
  const sides = [
    { set: leftSet, values: left },
    { set: rightSet, values: right },
  ];
  return (
    <View className="mb-1 flex-row items-center gap-1.5 px-2 py-1">
      <SetNumberCell
        setNumber={setNumber}
        label={String(setNumber)}
        isTarget={isTarget}
        ringDone={isRowDone(leftSet, isBodyweight) && isRowDone(rightSet, isBodyweight)}
      />
      {sides.map(({ set, values }, i) => (
        <View key={set.id} className={`flex-1 flex-row gap-1 ${i === 1 ? "ml-1.5" : ""}`}>
          {(["reps", "weight"] as const).map((field) => (
            <View key={field} className="flex-1">
              <SetNumberInput
                value={set[field]}
                fieldKey={setFieldKey(set.id, field)}
                placeholder={String(
                  field === "reps" ? values.suggestedReps : values.suggestedWeight,
                )}
                placeholderTextColor={colors.placeholder}
                selectionColor={colors.caret}
                onBlur={onBlur}
                onChangeValue={(value) => updateSet(exerciseId, set.id, { [field]: value })}
                className={INPUT_CLASS}
                style={{ height: INPUT_HEIGHT, fontSize: 15, textAlignVertical: "center" }}
                selectTextOnFocus
              />
            </View>
          ))}
        </View>
      ))}
      <AcceptButton
        setNumber={setNumber}
        isFilled={left.isFilled && right.isFilled}
        canAccept={left.canAccept || right.canAccept}
        label={`Use last time's L ${left.suggestedReps} × ${left.suggestedWeight} and R ${right.suggestedReps} × ${right.suggestedWeight} ${displayUnit}`}
        onPress={() => onAccept(left.updates, right.updates)}
      />
    </View>
  );
}

function parseDraft(text: string): number | undefined {
  const normalized = text.replace(",", ".");
  return normalized === "" || normalized === "." ? undefined : Number(normalized);
}

function SetNumberInput({
  value,
  onChangeValue,
  onBlur,
  onFocus,
  fieldKey,
  ...props
}: Omit<TextInputProps, "value" | "onChangeText" | "keyboardType"> & {
  value?: number;
  onChangeValue: (value: number | undefined) => void;
  /** Stop in the keyboard bar's Previous/Next order. */
  fieldKey?: string;
}) {
  const navigator = useSetFieldFocus();
  const register = useCallback(
    (input: TextInput | null) => {
      if (navigator && fieldKey) navigator.register(fieldKey, input);
    },
    [navigator, fieldKey],
  );
  // Keep intermediate text such as "20." while saving numeric values on every edit.
  const [draft, setDraft] = useState<string | null>(null);
  // A value changed from outside (e.g. accepting a suggestion) wins over a stale draft.
  const shownDraft = draft != null && parseDraft(draft) === value ? draft : null;

  return (
    <TextInput
      {...props}
      ref={register}
      keyboardType="decimal-pad"
      value={shownDraft ?? (value != null ? String(value) : "")}
      onChangeText={(text) => {
        if (!/^\d*(?:[.,]\d*)?$/.test(text)) return;
        const next = parseDraft(text);
        if (next != null && !Number.isFinite(next)) return;
        setDraft(text);
        onChangeValue(next);
      }}
      onFocus={(event) => {
        if (navigator && fieldKey) navigator.focused(fieldKey);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setDraft(null);
        if (navigator && fieldKey) navigator.blurred(fieldKey);
        onBlur?.(event);
      }}
    />
  );
}

function SetRow({
  set,
  setNumber,
  sideLabel,
  exerciseId,
  displayUnit,
  updateSet,
  onBlur,
  suggestion,
  isBodyweight,
  isTarget,
  targetDone,
}: {
  set: StoredSet;
  setNumber: number;
  sideLabel?: "R" | "L";
  exerciseId: string;
  displayUnit: string;
  updateSet: (exerciseId: string, setId: string, updates: Partial<StoredSet>) => void;
  onBlur?: () => void;
  suggestion: SetSuggestion;
  isBodyweight?: boolean;
  /** The set number this exercise usually finishes on. */
  isTarget?: boolean;
  /** Whether the target set is complete; a unilateral pair passes both sides. */
  targetDone?: boolean;
}) {
  const colors = useThemeColors();
  const { updates, canAccept, isFilled, suggestedReps, suggestedWeight } = acceptValues(
    set,
    suggestion,
    isBodyweight,
  );
  // Finish keeps any set with reps, so a reps-only bodyweight row counts as done.
  const ringDone = targetDone ?? isRowDone(set, isBodyweight);

  return (
    <View className="mb-1 flex-row items-center gap-2 px-2 py-1">
      <SetNumberCell
        setNumber={setNumber}
        label={sideLabel === "L" ? "" : String(setNumber)}
        isTarget={isTarget}
        ringDone={ringDone}
      />
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
        <SetNumberInput
          value={set.reps}
          fieldKey={setFieldKey(set.id, "reps")}
          placeholder={String(suggestedReps)}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.caret}
          onBlur={onBlur}
          onChangeValue={(reps) =>
            updateSet(exerciseId, set.id, {
              reps,
            })
          }
          className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-center dark:text-zinc-100"
          style={{ height: INPUT_HEIGHT, fontSize: 16, textAlignVertical: "center" }}
          selectTextOnFocus
        />
      </View>
      {isBodyweight && <Text className="text-xs text-zinc-400 dark:text-zinc-500">BW +</Text>}
      <View className="flex-1">
        <SetNumberInput
          value={set.weight}
          fieldKey={setFieldKey(set.id, "weight")}
          placeholder={String(suggestedWeight)}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.caret}
          onBlur={onBlur}
          onChangeValue={(weight) =>
            updateSet(exerciseId, set.id, {
              weight,
            })
          }
          className="rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-center dark:text-zinc-100"
          style={{ height: INPUT_HEIGHT, fontSize: 16, textAlignVertical: "center" }}
          selectTextOnFocus
        />
      </View>
      <Text className="w-8 text-xs text-zinc-400 dark:text-zinc-500">{displayUnit}</Text>
      <AcceptButton
        setNumber={setNumber}
        isFilled={isFilled}
        canAccept={canAccept}
        label={`Use last time's ${suggestedReps} reps at ${suggestedWeight} ${displayUnit}`}
        onPress={() => canAccept && updateSet(exerciseId, set.id, updates)}
      />
    </View>
  );
}

export default function ExerciseSlide({ exercise }: ExerciseSlideProps) {
  const {
    addSet,
    addUnilateralPair,
    updateSet,
    setSideMode,
    removeLastSet,
    removeLastUnilateralPair,
    trimTrailingEmptySets,
    changeExerciseProfile,
    mode,
  } = useWorkoutActions();
  const colors = useThemeColors();
  const { settings, getDisplayUnit } = useSettings();
  const { getSuggestion, getTargetSetCount } = usePreviousSets();
  const targetSetCount = getTargetSetCount(exercise.exerciseId, exercise.profileId);
  const { data: profiles = [] } = useExerciseProfiles(exercise.exerciseId);
  const createProfileMutation = useCreateExerciseProfile(exercise.exerciseId);
  const renameProfileMutation = useRenameExerciseProfile();
  const { getSuggestedProfile, recordProfileUsage, currentGymId } = useGymProfileSuggestion();
  const isBodyweight = exercise.exerciseType === "Bodyweight";
  const scrollRef = useRef<ScrollView>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  // Set while the profile sheet renames an existing profile instead of creating one.
  const [renamingProfileId, setRenamingProfileId] = useState<string | null>(null);

  // Persistent per-exercise note (cue) — shows every time you do this exercise.
  const { data: exerciseNotes } = useExerciseNotes();
  const noteMutation = useSetExerciseNote();
  const note = exerciseNotes?.get(exercise.exerciseId) ?? "";
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const openNoteEditor = useCallback(() => {
    setNoteDraft(note);
    setShowNoteModal(true);
  }, [note]);

  const handleSaveNote = useCallback(() => {
    noteMutation.mutate({ exerciseId: exercise.exerciseId, note: noteDraft });
    setShowNoteModal(false);
  }, [noteMutation, exercise.exerciseId, noteDraft]);

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

  const handleUpdateSet = useCallback(
    (exerciseId: string, setId: string, updates: Partial<StoredSet>) => {
      const set = exercise.sets.find((s) => s.id === setId);
      updateSet(exerciseId, setId, updates);

      if (mode !== "live" || !settings.autoAddSet || !set) return;

      const wasEmpty = set.reps == null && set.weight == null;
      if (!wasEmpty) return;
      const becomesNonEmpty = updates.reps != null || updates.weight != null;
      if (!becomesNonEmpty) return;

      if (exercise.isUnilateral) {
        const sideSets = exercise.sets.filter((s) => s.side === set.side);
        const setIndex = sideSets.findIndex((s) => s.id === setId);
        if (setIndex !== setGroups.length - 1) return;
        const otherSet = exercise.sets.filter((s) => s.side !== set.side)[setIndex];
        if (otherSet && (otherSet.reps != null || otherSet.weight != null)) return;
        addUnilateralPair(exercise.exerciseId, displayUnit);
      } else {
        if (exercise.sets[exercise.sets.length - 1]?.id !== setId) return;
        addSet(exercise.exerciseId, displayUnit);
      }
    },
    [
      exercise,
      updateSet,
      mode,
      settings.autoAddSet,
      addSet,
      addUnilateralPair,
      displayUnit,
      setGroups,
    ],
  );

  const handleSetBlur = useCallback(() => {
    if (mode !== "live" || !settings.autoAddSet || !settings.autoRemoveEmptySet) return;
    trimTrailingEmptySets(exercise.exerciseId, 1);
  }, [
    mode,
    settings.autoAddSet,
    settings.autoRemoveEmptySet,
    trimTrailingEmptySets,
    exercise.exerciseId,
  ]);

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
  }, [exercise.exerciseId, exercise.isUnilateral, removeLastSet, removeLastUnilateralPair]);

  const sideMode = sideModeOf(exercise);
  // Combined rows need both sides; a lopsided pair (e.g. one side deleted) shows split.
  const isCombined =
    sideMode === "unilateral" && setGroups.every((g) => g.leftSet != null && g.rightSet != null);

  // A combined row accepts both sides at once. The first write goes through
  // handleUpdateSet so live auto-add opens one new pair; the second is a plain write.
  const handleAcceptPair = useCallback(
    (
      leftSet: StoredSet,
      rightSet: StoredSet,
      left: Partial<StoredSet>,
      right: Partial<StoredSet>,
    ) => {
      const hasLeft = Object.keys(left).length > 0;
      const hasRight = Object.keys(right).length > 0;
      if (hasLeft) handleUpdateSet(exercise.exerciseId, leftSet.id, left);
      if (hasRight) {
        if (hasLeft) updateSet(exercise.exerciseId, rightSet.id, right);
        else handleUpdateSet(exercise.exerciseId, rightSet.id, right);
      }
    },
    [exercise.exerciseId, handleUpdateSet, updateSet],
  );

  // Extract base exercise name (without profile suffix)
  const baseName = useMemo(() => {
    if (exercise.profileId) {
      return stripProfileSuffix(exercise.exerciseName);
    }
    return exercise.exerciseName;
  }, [exercise.exerciseName, exercise.profileId]);

  // The title follows the profile's current name, so renames show at once and a
  // picker hint saved by older builds never shows.
  const currentProfileName = (profiles as Array<{ id: string; name: string }>).find(
    (p) => p.id === exercise.profileId,
  )?.name;
  const title = exercise.profileId
    ? currentProfileName != null
      ? exerciseTitle(baseName, currentProfileName)
      : withoutPickerHint(exercise.exerciseName)
    : exercise.exerciseName;

  // Keep the stored name in step (it shows in the summary and in this workout later).
  useEffect(() => {
    if (exercise.profileId && currentProfileName != null && title !== exercise.exerciseName) {
      changeExerciseProfile(exercise.exerciseId, exercise.profileId, title);
    }
  }, [
    title,
    currentProfileName,
    exercise.exerciseId,
    exercise.profileId,
    exercise.exerciseName,
    changeExerciseProfile,
  ]);

  const handleChangeProfile = useCallback(
    (profileId?: string, profileName?: string) => {
      const displayName = exerciseTitle(baseName, profileName);
      changeExerciseProfile(exercise.exerciseId, profileId, displayName);

      if (profileId) {
        recordProfileUsage(exercise.exerciseId, profileId);
      }

      setShowProfileModal(false);
    },
    [exercise.exerciseId, baseName, changeExerciseProfile, recordProfileUsage],
  );

  const hasProfiles = profiles.length > 0;

  // The menu icon is always tappable: with profiles it opens the picker,
  // without any it jumps straight to creating the first one.
  const handleOpenProfileMenu = useCallback(() => {
    if (hasProfiles) {
      setShowProfileModal(true);
    } else {
      setNewProfileName("");
      setShowCreateProfileModal(true);
    }
  }, [hasProfiles]);

  const handleOpenProfileCreator = useCallback(() => {
    setNewProfileName("");
    setRenamingProfileId(null);
    if (showProfileModal) {
      // Let the picker sheet finish dismissing before presenting the next one.
      setShowProfileModal(false);
      setTimeout(() => setShowCreateProfileModal(true), 350);
    } else {
      setShowCreateProfileModal(true);
    }
  }, [showProfileModal]);

  const handleOpenProfileRename = useCallback((profileId: string, name: string) => {
    setNewProfileName(name);
    setRenamingProfileId(profileId);
    // Let the picker sheet finish dismissing before presenting the next one.
    setShowProfileModal(false);
    setTimeout(() => setShowCreateProfileModal(true), 350);
  }, []);

  const handleCreateProfile = useCallback(async () => {
    const name = newProfileName.trim();
    if (!name) return;
    if (renamingProfileId) {
      try {
        await renameProfileMutation.mutateAsync({
          exerciseId: exercise.exerciseId,
          profileId: renamingProfileId,
          name,
        });
        setShowCreateProfileModal(false);
        setRenamingProfileId(null);
        setNewProfileName("");
      } catch {
        Alert.alert("Error", "Failed to rename profile.");
      }
      return;
    }
    try {
      const profile = await createProfileMutation.mutateAsync(name);
      setShowCreateProfileModal(false);
      setNewProfileName("");
      handleChangeProfile(profile.id, profile.name ?? name);
    } catch {
      Alert.alert("Error", "Failed to create profile.");
    }
  }, [
    newProfileName,
    renamingProfileId,
    renameProfileMutation,
    exercise.exerciseId,
    createProfileMutation,
    handleChangeProfile,
  ]);

  const profileBusy = createProfileMutation.isPending || renameProfileMutation.isPending;

  const canRemove = exercise.isUnilateral ? setGroups.length > 1 : exercise.sets.length > 1;
  const canDuplicate = exercise.sets.length > 0;

  const suggestedProfileId = getSuggestedProfile(exercise.exerciseId);

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900 px-3 pt-2">
      {/* Header */}
      <View className="mb-2">
        <Pressable
          onPress={handleOpenProfileMenu}
          hitSlop={8}
          className="flex-row items-center gap-1.5 active:opacity-60"
        >
          <Ionicons name="ellipsis-horizontal-circle" size={22} color={colors.accentIcon} />
          <Text className="flex-1 text-xl font-bold dark:text-zinc-100">{title}</Text>
        </Pressable>
        {exercise.exerciseType && (
          <View className="mt-1 flex-row items-center gap-2">
            <View
              className="items-center justify-center rounded bg-zinc-200 dark:bg-zinc-700 px-2"
              style={{ height: SIDE_BADGE_HEIGHT }}
            >
              <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {exercise.exerciseType}
              </Text>
            </View>
            <View
              accessibilityRole="radiogroup"
              className="flex-row rounded-lg bg-zinc-200 p-0.5 dark:bg-zinc-800"
            >
              {SIDE_MODES.map(({ mode: option, label }) => {
                const selected = option === sideMode;
                return (
                  <Pressable
                    key={option}
                    testID={`side-mode-${option}`}
                    accessibilityRole="radio"
                    accessibilityLabel={label}
                    accessibilityState={{ selected }}
                    onPress={() => !selected && setSideMode(exercise.exerciseId, option)}
                    hitSlop={4}
                    className={`rounded-md px-2.5 py-1 ${selected ? "bg-white dark:bg-zinc-600" : ""}`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selected
                          ? "text-zinc-900 dark:text-zinc-50"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Persistent note (cue) */}
        <Pressable onPress={openNoteEditor} className="mt-1.5 flex-row items-start gap-1.5">
          <Ionicons
            name={note ? "document-text" : "document-text-outline"}
            size={14}
            color={note ? colors.accentIcon : colors.mutedIcon}
            style={{ marginTop: 1 }}
          />
          {note ? (
            <Text className="flex-1 text-xs italic text-zinc-500 dark:text-zinc-400">{note}</Text>
          ) : (
            <Text className="text-xs text-zinc-400 dark:text-zinc-500">Add a note</Text>
          )}
        </Pressable>
      </View>

      {/* Set Table Header */}
      {isCombined ? (
        <View className="mb-1 flex-row items-center gap-1.5 px-2">
          <Text className="w-8 text-center text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
            Set
          </Text>
          {(["L", "R"] as const).map((side, i) => (
            <View
              key={side}
              className={`flex-1 flex-row items-center gap-1 ${i === 1 ? "ml-1.5" : ""}`}
            >
              <View
                className="items-center justify-center rounded px-1.5"
                style={{
                  height: SIDE_BADGE_HEIGHT,
                  backgroundColor: side === "R" ? colors.rightSideBg : colors.leftSideBg,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: side === "R" ? colors.rightSideText : colors.leftSideText }}
                >
                  {side}
                </Text>
              </View>
              <Text className="flex-1 text-center text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500">
                Reps
              </Text>
              <Text className="flex-1 text-center text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500">
                {isBodyweight ? `+${displayUnit}` : displayUnit}
              </Text>
            </View>
          ))}
          <View style={{ width: ACCEPT_BUTTON_SIZE }} />
        </View>
      ) : (
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
          <View style={{ width: ACCEPT_BUTTON_SIZE }} />
        </View>
      )}

      {/* Sets */}
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        bottomOffset={KEYBOARD_BAR_HEIGHT + 16}
        keyboardShouldPersistTaps="handled"
      >
        {isCombined
          ? setGroups.map((group) => {
              const { leftSet, rightSet } = group;
              if (!leftSet || !rightSet) return null;
              return (
                <PairRow
                  key={`${leftSet.id}-${rightSet.id}`}
                  leftSet={leftSet}
                  rightSet={rightSet}
                  setNumber={group.setNumber}
                  exerciseId={exercise.exerciseId}
                  displayUnit={displayUnit}
                  updateSet={handleUpdateSet}
                  onAccept={(left, right) => handleAcceptPair(leftSet, rightSet, left, right)}
                  onBlur={handleSetBlur}
                  leftSuggestion={getSuggestion(
                    exercise.exerciseId,
                    exercise.profileId,
                    group.setNumber,
                    "L",
                  )}
                  rightSuggestion={getSuggestion(
                    exercise.exerciseId,
                    exercise.profileId,
                    group.setNumber,
                    "R",
                  )}
                  isBodyweight={isBodyweight}
                  isTarget={group.setNumber === targetSetCount}
                />
              );
            })
          : exercise.isUnilateral
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
                const isTargetPair = group.setNumber === targetSetCount;
                const pairDone = [group.rightSet, group.leftSet].every(
                  (side) => side == null || isRowDone(side, isBodyweight),
                );
                return (
                  <View key={group.setNumber}>
                    {group.rightSet && (
                      <SetRow
                        key={group.rightSet.id}
                        set={group.rightSet}
                        setNumber={group.setNumber}
                        sideLabel="R"
                        exerciseId={exercise.exerciseId}
                        displayUnit={displayUnit}
                        updateSet={handleUpdateSet}
                        onBlur={handleSetBlur}
                        suggestion={rightSuggestion}
                        isBodyweight={isBodyweight}
                        isTarget={isTargetPair}
                        targetDone={pairDone}
                      />
                    )}
                    {group.leftSet && (
                      <SetRow
                        key={group.leftSet.id}
                        set={group.leftSet}
                        setNumber={group.setNumber}
                        sideLabel="L"
                        exerciseId={exercise.exerciseId}
                        displayUnit={displayUnit}
                        updateSet={handleUpdateSet}
                        onBlur={handleSetBlur}
                        suggestion={leftSuggestion}
                        isBodyweight={isBodyweight}
                        // The ring sits on the R row, or here when the pair has no R row.
                        isTarget={isTargetPair && !group.rightSet}
                        targetDone={pairDone}
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
                    updateSet={handleUpdateSet}
                    onBlur={handleSetBlur}
                    suggestion={suggestion}
                    isBodyweight={isBodyweight}
                    isTarget={index + 1 === targetSetCount}
                  />
                );
              })}
      </KeyboardAwareScrollView>

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
            <Text className="text-lg font-bold dark:text-zinc-100">Profile for {baseName}</Text>
            <Pressable
              onPress={() => setShowProfileModal(false)}
              className="rounded-lg px-3 py-1.5 active:bg-zinc-100 dark:active:bg-zinc-800"
            >
              <Text className="text-base font-medium text-blue-500">Cancel</Text>
            </Pressable>
          </View>
          <FlatList
            data={[
              { id: undefined, name: "Default (no profile)" },
              ...profiles.map((p: any) => ({
                id: p.id as string,
                name: p.name as string,
                lastUsedHere: p.id === suggestedProfileId && !!currentGymId,
              })),
            ]}
            keyExtractor={(item) => item.id ?? "default"}
            renderItem={({ item }) => {
              const isCurrent =
                item.id === exercise.profileId || (item.id === undefined && !exercise.profileId);
              const profileId = item.id;
              return (
                <Pressable
                  onPress={() => handleChangeProfile(item.id, item.id ? item.name : undefined)}
                  className="flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
                >
                  <View className="flex-1">
                    <Text className="text-base dark:text-zinc-100">{item.name}</Text>
                    {"lastUsedHere" in item && item.lastUsedHere && (
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                        Last used at this gym
                      </Text>
                    )}
                  </View>
                  {isCurrent && <Ionicons name="checkmark" size={20} color={colors.accentIcon} />}
                  {profileId && (
                    <Pressable
                      testID="rename-profile"
                      accessibilityRole="button"
                      accessibilityLabel={`Rename ${item.name}`}
                      onPress={() => handleOpenProfileRename(profileId, item.name)}
                      hitSlop={8}
                      className="ml-3 h-9 w-9 items-center justify-center rounded-full active:bg-zinc-200 dark:active:bg-zinc-700"
                    >
                      <Ionicons name="pencil" size={18} color={colors.placeholder} />
                    </Pressable>
                  )}
                </Pressable>
              );
            }}
            ListFooterComponent={
              <Pressable
                onPress={handleOpenProfileCreator}
                className="flex-row items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
              >
                <Ionicons name="add" size={20} color={colors.accentIcon} />
                <Text className="text-base text-blue-500">New profile</Text>
              </Pressable>
            }
          />
        </View>
      </Modal>

      {/* Profile Creator Modal */}
      <Modal
        visible={showCreateProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateProfileModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-white dark:bg-zinc-900"
        >
          <View className="flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-4 pb-3 pt-4">
            <Text className="text-lg font-bold dark:text-zinc-100">
              {renamingProfileId ? "Rename profile" : "New profile"}
            </Text>
            <Pressable
              onPress={() => setShowCreateProfileModal(false)}
              className="rounded-lg px-3 py-1.5 active:bg-zinc-100 dark:active:bg-zinc-800"
            >
              <Text className="text-base font-medium text-blue-500">Cancel</Text>
            </Pressable>
          </View>
          <View className="p-4">
            <Text className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              A profile tracks {baseName} separately — e.g. a specific machine, bar, or grip.
            </Text>
            <TextInput
              value={newProfileName}
              onChangeText={setNewProfileName}
              placeholder="e.g. Hammer Strength, wide grip"
              placeholderTextColor={colors.placeholder}
              maxLength={100}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateProfile}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 dark:text-zinc-100"
              style={{ fontSize: 16 }}
            />
            <Pressable
              onPress={handleCreateProfile}
              disabled={profileBusy || !newProfileName.trim()}
              className={`mt-4 items-center rounded-lg py-3 ${
                profileBusy || !newProfileName.trim()
                  ? "bg-zinc-200 dark:bg-zinc-700"
                  : "bg-blue-500 active:bg-blue-600"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  profileBusy || !newProfileName.trim()
                    ? "text-zinc-400 dark:text-zinc-500"
                    : "text-white"
                }`}
              >
                {renamingProfileId
                  ? renameProfileMutation.isPending
                    ? "Saving..."
                    : "Save"
                  : createProfileMutation.isPending
                    ? "Creating..."
                    : "Create"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Note editor modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View className="flex-1 bg-white dark:bg-zinc-900">
          <View className="flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-4 pb-3 pt-4">
            <Pressable
              onPress={() => setShowNoteModal(false)}
              className="rounded-lg px-3 py-1.5 active:bg-zinc-100 dark:active:bg-zinc-800"
            >
              <Text className="text-base font-medium text-zinc-500">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-bold dark:text-zinc-100">Note</Text>
            <Pressable
              onPress={handleSaveNote}
              disabled={noteMutation.isPending}
              className="rounded-lg px-3 py-1.5 active:bg-zinc-100 dark:active:bg-zinc-800"
              style={{ opacity: noteMutation.isPending ? 0.5 : 1 }}
            >
              <Text className="text-base font-semibold text-blue-500">Save</Text>
            </Pressable>
          </View>
          <View className="p-4">
            <Text className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              A cue for {baseName} — shows every time you do this exercise.
            </Text>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="e.g. drive through your heels, keep core tight"
              placeholderTextColor={colors.placeholder}
              maxLength={1000}
              multiline
              autoFocus
              className="min-h-24 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 p-3 dark:text-zinc-100"
              style={{ fontSize: 16, textAlignVertical: "top" }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
