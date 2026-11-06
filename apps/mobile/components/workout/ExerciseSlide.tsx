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
import { useSideDefault } from "../../hooks/useSideDefault";
import type { SetSuggestion } from "../../lib/previous-sets";
import {
  isRowEmpty,
  MODE_LABEL,
  NEXT_MODE,
  rowIndexOf,
  rowMode,
  toRows,
  type SideMode,
  type SetRow as RowModel,
} from "../../lib/set-rows";
import { convertWeight } from "../../lib/units";
import type { StoredSet, StoredWorkoutExercise } from "../../services/storage";
import RestTimer from "./RestTimer";
import { singleLineInput } from "../../lib/input-style";
import { lightTap } from "../../lib/haptics";
import { compareSet, type SetResult } from "../../lib/set-result";

// Stoplight for a done set against its suggestion. The yellow stays clear of Ember.
const RESULT_STYLE: Record<SetResult, { color: string; bg: string; label: string }> = {
  above: { color: "#22C55E", bg: "rgba(34,197,94,0.15)", label: "above last time" },
  same: { color: "#FACC15", bg: "rgba(250,204,21,0.15)", label: "same as last time" },
  below: { color: "#EF4444", bg: "rgba(239,68,68,0.15)", label: "below last time" },
};

interface ExerciseSlideProps {
  exercise: StoredWorkoutExercise;
}

const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = 20;

const INPUT_HEIGHT = 40;
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
  mode,
  onCycleMode,
  ghost,
  onMakeReal,
}: {
  setNumber: number;
  label: string;
  isTarget?: boolean;
  ringDone: boolean;
  /** The row's mode; shown small under the number when the number can be tapped. */
  mode?: SideMode;
  onCycleMode?: () => void;
  /** Nothing logged yet: the number fills the row instead of cycling its mode. */
  ghost?: boolean;
  onMakeReal?: () => void;
}) {
  const colors = useThemeColors();
  const number = !isTarget ? (
    <Text className="text-center text-sm font-medium text-zinc-400 dark:text-zinc-500">
      {label}
    </Text>
  ) : (
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
  );
  const modeGlyph = mode && (
    <Text
      className="mt-0.5 text-[8px] font-bold uppercase tracking-wide"
      style={{
        color:
          ghost || mode === "bilateral"
            ? colors.placeholder
            : mode === "unilateral"
              ? colors.leftSideText
              : colors.rightSideText,
      }}
    >
      {mode === "bilateral" ? "bi" : mode === "unilateral" ? "uni" : "split"}
    </Text>
  );
  // A ghost row's number makes it real (like the accept check); its mode follows the
  // exercise default until then.
  if (ghost && onMakeReal) {
    return (
      <Pressable
        testID="make-real"
        accessibilityRole="button"
        accessibilityLabel={`Set ${setNumber}, not logged yet. Tap to fill it from last time`}
        onPress={onMakeReal}
        hitSlop={6}
        className="w-8 items-center active:opacity-50"
      >
        {number}
        {modeGlyph}
      </Pressable>
    );
  }
  if (!onCycleMode || !mode) return <View className="w-8 items-center">{number}</View>;
  // Tapping the set number cycles this row: Bilateral -> Unilateral -> Split.
  return (
    <Pressable
      testID="set-mode"
      accessibilityRole="button"
      accessibilityLabel={`Set ${setNumber}, ${MODE_LABEL[mode]}. Tap for ${MODE_LABEL[NEXT_MODE[mode]]}`}
      onPress={onCycleMode}
      hitSlop={6}
      className="w-8 items-center active:opacity-50"
    >
      {number}
      {modeGlyph}
    </Pressable>
  );
}

function AcceptButton({
  setNumber,
  isFilled,
  canAccept,
  label,
  onPress,
  result,
}: {
  setNumber: number;
  isFilled: boolean;
  canAccept: boolean;
  label: string;
  onPress: () => void;
  /** How the done set compares with its suggestion; null keeps the plain check. */
  result?: SetResult | null;
}) {
  const colors = useThemeColors();
  const style = isFilled && result ? RESULT_STYLE[result] : null;
  // A light tap when a set lands above or below the suggestion.
  const lastResult = useRef(result);
  useEffect(() => {
    if (isFilled && result && result !== lastResult.current && result !== "same") {
      lightTap();
    }
    lastResult.current = isFilled ? result : null;
  }, [isFilled, result]);
  return (
    <Pressable
      testID="accept-suggestion"
      accessibilityRole="button"
      accessibilityLabel={
        isFilled
          ? `Set ${setNumber} filled${style ? `, ${style.label}` : ""}`
          : canAccept
            ? label
            : `No previous set to copy`
      }
      accessibilityState={{ disabled: !canAccept }}
      disabled={!canAccept}
      onPress={onPress}
      hitSlop={6}
      className={`items-center justify-center rounded-full ${
        style
          ? ""
          : isFilled
            ? "bg-green-500/15"
            : canAccept
              ? "border border-zinc-300 dark:border-zinc-600 active:bg-zinc-200 dark:active:bg-zinc-700"
              : "opacity-30"
      }`}
      style={{
        width: ACCEPT_BUTTON_SIZE,
        height: ACCEPT_BUTTON_SIZE,
        ...(style ? { backgroundColor: style.bg } : null),
      }}
    >
      <Ionicons
        name={
          style
            ? result === "above"
              ? "arrow-up"
              : result === "below"
                ? "arrow-down"
                : "arrow-forward"
            : "checkmark"
        }
        size={20}
        color={style ? style.color : isFilled ? colors.successIcon : colors.placeholder}
      />
    </Pressable>
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
  inputRef,
  ...props
}: Omit<TextInputProps, "value" | "onChangeText" | "keyboardType"> & {
  value?: number;
  onChangeValue: (value: number | undefined) => void;
  /** Stop in the keyboard bar's Previous/Next order. */
  fieldKey?: string;
  /** The row's own handle, e.g. to focus reps when a ghost has nothing to fill. */
  inputRef?: { current: TextInput | null };
}) {
  const navigator = useSetFieldFocus();
  const register = useCallback(
    (input: TextInput | null) => {
      if (inputRef) inputRef.current = input;
      if (navigator && fieldKey) navigator.register(fieldKey, input);
    },
    [navigator, fieldKey, inputRef],
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
  mode,
  onCycleMode,
  showSideColumn,
  ghost,
  onMakeReal,
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
  mode?: SideMode;
  onCycleMode?: () => void;
  /** Some row is split, so bilateral rows leave room for the side badge. */
  showSideColumn?: boolean;
  /** Nothing logged in this row yet: drawn dimmed with dashed fields. */
  ghost?: boolean;
  /** Fills a ghost row; false when there was nothing to fill it with. */
  onMakeReal?: () => boolean;
}) {
  const colors = useThemeColors();
  const repsRef = useRef<TextInput | null>(null);
  const { updates, canAccept, isFilled, suggestedReps, suggestedWeight } = acceptValues(
    set,
    suggestion,
    isBodyweight,
  );
  // Finish keeps any set with reps, so a reps-only bodyweight row counts as done.
  const ringDone = targetDone ?? isRowDone(set, isBodyweight);
  // Ghost fields: dashed and dim, so they don't read as logged sets. Typing still goes
  // straight in (the grey number is only a placeholder) and makes the row real.
  const fieldStyle = {
    height: INPUT_HEIGHT,
    fontSize: 16,
    textAlignVertical: "center" as const,
    ...(ghost ? { borderStyle: "dashed" as const } : null),
  };

  return (
    <View
      testID={ghost ? "ghost-row" : "set-row"}
      className="mb-1 flex-row items-center gap-2 px-2 py-1"
      style={ghost ? { opacity: 0.55 } : undefined}
    >
      <SetNumberCell
        setNumber={setNumber}
        label={sideLabel === "L" ? "" : String(setNumber)}
        isTarget={isTarget}
        ringDone={ringDone}
        mode={mode}
        onCycleMode={onCycleMode}
        ghost={ghost}
        // Nothing to fill from (no history, nothing above): start typing reps instead.
        onMakeReal={onMakeReal && (() => void (onMakeReal() || repsRef.current?.focus()))}
      />
      {sideLabel == null ? (
        showSideColumn && <View className="w-7" />
      ) : (
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
          inputRef={repsRef}
          placeholder={String(suggestedReps)}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.caret}
          onBlur={onBlur}
          onChangeValue={(reps) =>
            updateSet(exerciseId, set.id, {
              reps,
            })
          }
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-center font-semibold dark:text-zinc-100"
          style={fieldStyle}
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
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-center font-semibold dark:text-zinc-100"
          style={fieldStyle}
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
        result={isFilled ? compareSet(set, suggestion, set.weightUnit) : null}
      />
    </View>
  );
}

export default function ExerciseSlide({ exercise }: ExerciseSlideProps) {
  const {
    addSet,
    addUnilateralPair,
    updateSet,
    setRowMode,
    removeLastSet,
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

  // One numbered row per set; each row has its own mode (bilateral, unilateral, split).
  const rows = useMemo(() => toRows(exercise.sets), [exercise.sets]);
  const lastRow = rows[rows.length - 1];
  const lastMode: SideMode = lastRow ? rowMode(lastRow) : "bilateral";
  const showSideColumn = rows.some((row) => rowMode(row) === "split");
  // The exercise default picks the mode for new rows; tapping a set number overrides one row.
  const [defaultMode, chooseDefaultMode] = useSideDefault(exercise.exerciseId, lastMode);

  const addRow = useCallback(
    (rowModeToAdd: SideMode, weightUnit: string, reps?: number, weight?: number) => {
      if (rowModeToAdd === "bilateral") addSet(exercise.exerciseId, weightUnit, reps, weight);
      else
        addUnilateralPair(
          exercise.exerciseId,
          weightUnit,
          reps,
          weight,
          rowModeToAdd === "unilateral" ? "combined" : undefined,
        );
    },
    [exercise.exerciseId, addSet, addUnilateralPair],
  );

  const handleAddSet = useCallback(() => {
    addRow(defaultMode, displayUnit);
    // Scroll to bottom after add
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [addRow, defaultMode, displayUnit]);

  const handleUpdateSet = useCallback(
    (exerciseId: string, setId: string, updates: Partial<StoredSet>) => {
      const index = rowIndexOf(rows, setId);
      updateSet(exerciseId, setId, updates);

      // Auto-add one row like this one when the last row gets its first value.
      if (mode !== "live" || !settings.autoAddSet || index < 0) return;
      if (index !== rows.length - 1 || !isRowEmpty(rows[index])) return;
      if (updates.reps == null && updates.weight == null) return;
      addRow(defaultMode, displayUnit);
    },
    [rows, updateSet, mode, settings.autoAddSet, addRow, displayUnit, defaultMode],
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

  const handleDuplicateLastSet = useCallback(() => {
    if (!lastRow) return;
    // Copy the last row with real values; empty rows and grey placeholders don't count.
    let sourceIndex = rows.length - 1;
    while (sourceIndex >= 0 && isRowEmpty(rows[sourceIndex])) sourceIndex--;
    const source = rows[sourceIndex];
    const sideOf = (row: RowModel, side: "R" | "L"): StoredSet =>
      row.kind === "bilateral"
        ? row.set
        : side === "R"
          ? (row.right ?? row.left)!
          : (row.left ?? row.right)!;
    const valuesOf = (set: StoredSet) => ({
      reps: set.reps ?? DEFAULT_REPS,
      weight: set.weight ?? DEFAULT_WEIGHT,
    });

    // A trailing empty row (e.g. auto-added) gets the copy instead of a new row below it.
    if (source && sourceIndex < rows.length - 1) {
      const target = lastRow;
      if (target.kind === "bilateral") {
        updateSet(exercise.exerciseId, target.set.id, valuesOf(sideOf(source, "R")));
      } else {
        // Split copies each side; a unilateral row keeps L = R.
        const leftFrom = target.layout === "combined" ? "R" : "L";
        if (target.right)
          updateSet(exercise.exerciseId, target.right.id, valuesOf(sideOf(source, "R")));
        if (target.left)
          updateSet(exercise.exerciseId, target.left.id, valuesOf(sideOf(source, leftFrom)));
      }
      return;
    }

    const from = source ?? lastRow;
    const set = sideOf(from, "R");
    const { reps, weight } = valuesOf(set);
    addRow(rowMode(from), set.weightUnit, reps, weight);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [rows, lastRow, addRow, updateSet, exercise.exerciseId]);

  const handleRemoveLastSet = useCallback(() => {
    removeLastSet(exercise.exerciseId);
  }, [exercise.exerciseId, removeLastSet]);

  const handleCycleMode = useCallback(
    (rowIndex: number) => {
      const row = rows[rowIndex];
      if (row) setRowMode(exercise.exerciseId, rowIndex, NEXT_MODE[rowMode(row)]);
    },
    [rows, exercise.exerciseId, setRowMode],
  );

  /**
   * Makes a ghost row real: each side takes last time's values for this set (as the
   * accept check does), or else the last filled row's. The first write goes through
   * handleUpdateSet so auto-add behaves as if it was typed.
   */
  const handleMakeReal = useCallback(
    (rowIndex: number): boolean => {
      const row = rows[rowIndex];
      if (!row || !isRowEmpty(row)) return false;
      const setNumber = rowIndex + 1;
      let sourceIndex = rowIndex - 1;
      while (sourceIndex >= 0 && isRowEmpty(rows[sourceIndex])) sourceIndex--;
      const source = rows[sourceIndex];
      const fromSource = (
        target: StoredSet,
        side: "R" | "L" | undefined,
      ): Partial<StoredSet> | null => {
        if (!source) return null;
        const s =
          source.kind === "bilateral"
            ? source.set
            : side === "L"
              ? (source.left ?? source.right)
              : (source.right ?? source.left);
        if (!s || (s.reps == null && s.weight == null)) return null;
        // The earlier row may be in another unit if the unit changed mid-workout.
        const weight =
          s.weight != null ? convertWeight(s.weight, s.weightUnit, target.weightUnit) : s.weight;
        return { reps: s.reps, weight };
      };
      const suggest = (side: "R" | "L" | undefined) =>
        getSuggestion(exercise.exerciseId, exercise.profileId, setNumber, side);
      const fill = (set: StoredSet, side: "R" | "L" | undefined, combined = false) => {
        // A unilateral row shows R's suggestion, or L's when R has none; fill the same.
        let suggestion = suggest(side);
        if (combined && suggestion.reps == null) suggestion = suggest("L");
        const accepted = acceptValues(set, suggestion, isBodyweight);
        return accepted.canAccept ? accepted.updates : fromSource(set, side);
      };
      if (row.kind === "bilateral") {
        const updates = fill(row.set, undefined);
        if (updates) handleUpdateSet(exercise.exerciseId, row.set.id, updates);
        return updates != null;
      }
      // Unilateral means L = R, so both sides take the row's one value.
      const combined = row.layout === "combined";
      const rightUpdates = row.right ? fill(row.right, "R", combined) : null;
      const leftUpdates =
        combined && row.right ? rightUpdates : row.left ? fill(row.left, "L", combined) : null;
      // The first write goes through handleUpdateSet so auto-add runs once.
      const writes = [
        row.right && rightUpdates && { id: row.right.id, updates: rightUpdates },
        row.left && leftUpdates && { id: row.left.id, updates: leftUpdates },
      ].filter((w): w is { id: string; updates: Partial<StoredSet> } => !!w);
      writes.forEach((w, i) =>
        (i === 0 ? handleUpdateSet : updateSet)(exercise.exerciseId, w.id, w.updates),
      );
      return writes.length > 0;
    },
    [
      rows,
      getSuggestion,
      exercise.exerciseId,
      exercise.profileId,
      isBodyweight,
      handleUpdateSet,
      updateSet,
    ],
  );

  // Changing the default also switches rows that have nothing in them yet.
  const handleDefaultMode = useCallback(
    (next: SideMode) => {
      chooseDefaultMode(next);
      rows.forEach((row, i) => {
        if (isRowEmpty(row) && rowMode(row) !== next) setRowMode(exercise.exerciseId, i, next);
      });
    },
    [chooseDefaultMode, rows, exercise.exerciseId, setRowMode],
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

  const canRemove = rows.length > 1;
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
          </View>
        )}

        {/* Default mode for new sets on this exercise */}
        <View
          accessibilityRole="radiogroup"
          className="mt-1.5 flex-row self-start rounded-lg bg-zinc-200 p-0.5 dark:bg-zinc-800"
        >
          {(["bilateral", "unilateral", "split"] as const).map((option) => {
            const selected = option === defaultMode;
            return (
              <Pressable
                key={option}
                testID={`side-default-${option}`}
                accessibilityRole="radio"
                accessibilityLabel={`New sets: ${MODE_LABEL[option]}`}
                accessibilityState={{ selected }}
                onPress={() => !selected && handleDefaultMode(option)}
                hitSlop={4}
                className={`rounded-md px-3 py-1 ${selected ? "bg-ember-500" : ""}`}
              >
                <Text
                  maxFontSizeMultiplier={1.4}
                  className={`text-xs font-semibold ${
                    selected ? "text-ember-ink" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {option === "bilateral" ? "Bi" : option === "unilateral" ? "Uni" : "Split"}
                </Text>
              </Pressable>
            );
          })}
        </View>

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
      {
        <View className="mb-1 flex-row items-center gap-2 px-2">
          <Text className="w-8 text-center text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
            Set
          </Text>
          {showSideColumn && (
            // Short label on one line: "SIDE" wrapped to "SID / E" at w-7.
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
              className="w-7 text-center text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500"
            >
              L/R
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
      }

      {/* Sets */}
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        bottomOffset={KEYBOARD_BAR_HEIGHT + 16}
        keyboardShouldPersistTaps="handled"
      >
        {rows.map((row, index) => {
          const setNumber = index + 1;
          const rowModeNow = rowMode(row);
          const isTarget = setNumber === targetSetCount;
          const cycle = () => handleCycleMode(index);
          // Ghost: nothing logged yet. Its number fills it; only real rows cycle mode.
          const ghost = isRowEmpty(row);
          const makeReal = () => handleMakeReal(index);
          const suggestionFor = (side?: "L" | "R") =>
            getSuggestion(exercise.exerciseId, exercise.profileId, setNumber, side);
          const common = {
            setNumber,
            exerciseId: exercise.exerciseId,
            displayUnit,
            updateSet: handleUpdateSet,
            onBlur: handleSetBlur,
            isBodyweight,
            showSideColumn,
            ghost,
          };
          if (row.kind === "bilateral") {
            return (
              <SetRow
                key={row.set.id}
                {...common}
                set={row.set}
                suggestion={suggestionFor()}
                isTarget={isTarget}
                mode="bilateral"
                onCycleMode={cycle}
                onMakeReal={makeReal}
              />
            );
          }
          const { left, right } = row;
          if (rowModeNow === "unilateral" && left && right) {
            const rightSuggestion = suggestionFor("R");
            return (
              <SetRow
                key={`${right.id}-${left.id}`}
                {...common}
                set={right}
                // L = R implied: every edit and accept writes both sides.
                updateSet={(exerciseId, _setId, updates) => {
                  handleUpdateSet(exerciseId, right.id, updates);
                  updateSet(exerciseId, left.id, updates);
                }}
                suggestion={rightSuggestion.reps != null ? rightSuggestion : suggestionFor("L")}
                isTarget={isTarget}
                mode="unilateral"
                onCycleMode={cycle}
                onMakeReal={makeReal}
              />
            );
          }
          // Split rows (or a unilateral row missing a side): R row, then L row.
          const pairDone = [right, left].every((s) => s == null || isRowDone(s, isBodyweight));
          const sides = [
            right && { set: right, label: "R" as const },
            left && { set: left, label: "L" as const },
          ].filter((x): x is { set: StoredSet; label: "R" | "L" } => !!x);
          return (
            <View key={sides.map((x) => x.set.id).join("-")}>
              {sides.map(({ set, label }, i) => (
                <SetRow
                  key={set.id}
                  {...common}
                  set={set}
                  sideLabel={label}
                  suggestion={suggestionFor(label)}
                  isTarget={isTarget && i === 0}
                  targetDone={pairDone}
                  mode={i === 0 ? rowModeNow : undefined}
                  onCycleMode={i === 0 ? cycle : undefined}
                  onMakeReal={i === 0 ? makeReal : undefined}
                />
              ))}
            </View>
          );
        })}
      </KeyboardAwareScrollView>

      {/* Rest Timer */}
      <RestTimer />

      {/* Action Buttons */}
      <View className="flex-row justify-center gap-3 pb-2 pt-1">
        <Pressable
          onPress={handleAddSet}
          className="h-10 w-10 items-center justify-center rounded-full border border-ember-500 active:bg-ember-50"
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
              <Text className="text-base font-medium text-ember-700 dark:text-ember-500">
                Cancel
              </Text>
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
                <Text className="text-base text-ember-700 dark:text-ember-500">New profile</Text>
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
              <Text className="text-base font-medium text-ember-700 dark:text-ember-500">
                Cancel
              </Text>
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
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 dark:text-zinc-100"
              style={singleLineInput}
            />
            <Pressable
              onPress={handleCreateProfile}
              disabled={profileBusy || !newProfileName.trim()}
              className={`mt-4 items-center rounded-lg py-3 ${
                profileBusy || !newProfileName.trim()
                  ? "bg-zinc-200 dark:bg-zinc-700"
                  : "bg-ember-500 active:bg-ember-600"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  profileBusy || !newProfileName.trim()
                    ? "text-zinc-400 dark:text-zinc-500"
                    : "text-ember-ink"
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
              <Text className="text-base font-semibold text-ember-700 dark:text-ember-500">
                Save
              </Text>
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
