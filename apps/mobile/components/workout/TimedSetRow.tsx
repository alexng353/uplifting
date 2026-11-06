import { useCallback, useRef, useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useThemeColors } from "../../hooks/useThemeColors";
import { useSetFieldFocus } from "../../hooks/useSetFieldFocus";
import { setFieldKey, type SetField } from "../../lib/set-field-order";
import type { SetSuggestion } from "../../lib/previous-sets";
import { formatDuration, isTimedSet, parseDuration, timedUpdate } from "../../lib/timed";
import type { StoredSet } from "../../services/storage";

const INPUT_HEIGHT = 40;
const CHECK_SIZE = 36;

/** Column titles for a timed exercise (treadmill walks and the like). */
export function TimedHeader({ speedUnit }: { speedUnit: string }) {
  const cls = "flex-1 text-center text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500";
  return (
    <View testID="timed-header" className="mb-1 flex-row items-center gap-2 px-2">
      <Text className="w-8 text-center text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
        Set
      </Text>
      <Text className={cls}>Time</Text>
      <Text className={cls} numberOfLines={1}>
        Speed {speedUnit}
      </Text>
      <Text className={cls}>Incline %</Text>
      <View style={{ width: CHECK_SIZE }} />
    </View>
  );
}

/** A field that registers with the Prev/Next bar and keeps half-typed text ("10:", "3."). */
function Field({
  shown,
  onText,
  fieldKey,
  inputRef,
  ...props
}: Omit<TextInputProps, "value" | "onChangeText"> & {
  shown: string;
  onText: (text: string) => void;
  fieldKey: string;
  inputRef?: { current: TextInput | null };
}) {
  const navigator = useSetFieldFocus();
  const [draft, setDraft] = useState<string | null>(null);
  const register = useCallback(
    (input: TextInput | null) => {
      if (inputRef) inputRef.current = input;
      navigator?.register(fieldKey, input);
    },
    [navigator, fieldKey, inputRef],
  );
  return (
    <TextInput
      {...props}
      ref={register}
      keyboardType="decimal-pad"
      value={draft ?? shown}
      onChangeText={(text) => {
        if (!/^[\d.,:]*$/.test(text)) return;
        setDraft(text);
        onText(text);
      }}
      onFocus={(e) => {
        navigator?.focused(fieldKey);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setDraft(null);
        navigator?.blurred(fieldKey);
        props.onBlur?.(e);
      }}
    />
  );
}

const numberOf = (text: string) => {
  const t = text.replace(",", ".");
  return t === "" || t === "." || !Number.isFinite(Number(t)) ? undefined : Number(t);
};
const show = (n?: number) => (n == null ? "" : String(n));

/**
 * One timed set: time (mm:ss, or plain minutes), speed and incline. A ghost row shows
 * last time's values as placeholders; typing or the check makes it real.
 */
export default function TimedSetRow({
  set,
  setNumber,
  ghost,
  suggestion,
  speedUnit,
  onChange,
  onMakeReal,
  onBlur,
}: {
  set: StoredSet;
  setNumber: number;
  ghost: boolean;
  suggestion: SetSuggestion;
  speedUnit: string;
  onChange: (updates: Partial<StoredSet>) => void;
  /** Fills a ghost from last time or the set above; false when there was nothing. */
  onMakeReal: () => boolean;
  onBlur?: () => void;
}) {
  const colors = useThemeColors();
  const timeRef = useRef<TextInput | null>(null);
  const unit = set.speedUnit ?? speedUnit;
  const done = isTimedSet(set);
  const canAccept = !done && suggestion.durationSeconds != null;
  const write = (patch: { d?: number | null; s?: number | null; i?: number | null }) =>
    onChange(
      timedUpdate(
        patch.d === undefined ? set.durationSeconds : (patch.d ?? undefined),
        patch.s === undefined ? set.speed : (patch.s ?? undefined),
        unit,
        patch.i === undefined ? set.incline : (patch.i ?? undefined),
      ),
    );
  const key = (f: SetField) => setFieldKey(set.id, f);
  // Same rule as weight rows: the row never loses its styles, or Fabric flattens it and
  // the focused field drops the keyboard on the first keystroke.
  const fieldStyle = {
    height: INPUT_HEIGHT,
    fontSize: 16,
    textAlignVertical: "center" as const,
    borderStyle: ghost ? ("dashed" as const) : ("solid" as const),
  };
  const fieldClass =
    "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1 text-center font-semibold dark:text-zinc-100";
  const sugUnitMatches = (suggestion.speedUnit ?? unit) === unit;

  return (
    <View
      testID={ghost ? "ghost-row" : "set-row"}
      collapsable={false}
      className="mb-1 flex-row items-center gap-2 px-2 py-1"
      style={{ opacity: ghost ? 0.55 : 1 }}
    >
      <Pressable
        testID={ghost ? "make-real" : "timed-set-number"}
        accessibilityLabel={
          ghost
            ? `Set ${setNumber}, not logged yet. Tap to fill it from last time`
            : `Set ${setNumber}`
        }
        disabled={!ghost}
        onPress={() => void (onMakeReal() || timeRef.current?.focus())}
        hitSlop={6}
        className="w-8 items-center active:opacity-50"
      >
        <Text className="text-center text-sm font-medium text-zinc-400 dark:text-zinc-500">
          {setNumber}
        </Text>
      </Pressable>
      <View className="flex-1">
        <Field
          testID="timed-duration"
          fieldKey={key("reps")}
          inputRef={timeRef}
          shown={set.durationSeconds ? formatDuration(set.durationSeconds) : ""}
          onText={(t) => write({ d: parseDuration(t) ?? null })}
          placeholder={
            suggestion.durationSeconds ? formatDuration(suggestion.durationSeconds) : "mm:ss"
          }
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.caret}
          onBlur={onBlur}
          className={fieldClass}
          style={fieldStyle}
          selectTextOnFocus
        />
      </View>
      <View className="flex-1">
        <Field
          testID="timed-speed"
          fieldKey={key("weight")}
          shown={show(set.speed)}
          onText={(t) => write({ s: numberOf(t) ?? null })}
          placeholder={sugUnitMatches && suggestion.speed != null ? show(suggestion.speed) : "–"}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.caret}
          onBlur={onBlur}
          className={fieldClass}
          style={fieldStyle}
          selectTextOnFocus
        />
      </View>
      <View className="flex-1">
        <Field
          testID="timed-incline"
          fieldKey={key("incline")}
          shown={show(set.incline)}
          onText={(t) => write({ i: numberOf(t) ?? null })}
          placeholder={suggestion.incline != null ? show(suggestion.incline) : "–"}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.caret}
          onBlur={onBlur}
          className={fieldClass}
          style={fieldStyle}
          selectTextOnFocus
        />
      </View>
      <Pressable
        testID="accept-suggestion"
        accessibilityRole="button"
        accessibilityLabel={
          done
            ? `Set ${setNumber} logged`
            : canAccept
              ? `Use last time's ${formatDuration(suggestion.durationSeconds!)}`
              : "No previous set to copy"
        }
        disabled={!canAccept}
        onPress={() =>
          canAccept &&
          onChange(
            timedUpdate(
              suggestion.durationSeconds,
              sugUnitMatches ? suggestion.speed : undefined,
              unit,
              suggestion.incline,
            ),
          )
        }
        hitSlop={6}
        className={`items-center justify-center rounded-full ${
          done
            ? "bg-green-500/15"
            : canAccept
              ? "border border-zinc-300 dark:border-zinc-600"
              : "opacity-30"
        }`}
        style={{ width: CHECK_SIZE, height: CHECK_SIZE }}
      >
        <Ionicons
          name="checkmark"
          size={20}
          color={done ? colors.successIcon : colors.placeholder}
        />
      </Pressable>
    </View>
  );
}
