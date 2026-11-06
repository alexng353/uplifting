import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useSettings } from "../../../hooks/useSettings";
import { DEFAULT_REP_RANGES, type RepRangeConfig } from "../../../services/storage";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { inlineInput } from "../../../lib/input-style";
import { contrastOn, rangeErrors, sameColor, swatchesFor } from "../../../lib/rep-ranges";

type RangeWithId = RepRangeConfig & { _id: number };

let nextRangeId = 0;
function withId(range: RepRangeConfig): RangeWithId {
  return { ...range, _id: nextRangeId++ };
}

export default function RepRangesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { settings, updateSettings } = useSettings();
  const [ranges, setRanges] = useState<RangeWithId[]>(() =>
    (settings.repRanges ?? [...DEFAULT_REP_RANGES]).map(withId),
  );
  const errors = useMemo(() => rangeErrors(ranges), [ranges]);
  // Autosave: the latest valid ranges are written after a short pause in typing, at once for
  // taps (colour, add, remove), and on leaving the screen. Invalid edits stay on screen with
  // an inline error and are never written.
  const latest = useRef(ranges);
  latest.current = ranges;
  const dirty = useRef(false);
  const persist = useCallback(() => {
    if (!dirty.current) return;
    const current = latest.current;
    if (rangeErrors(current).some((e) => e !== null)) return;
    dirty.current = false;
    updateSettings({ repRanges: current.map(({ _id, ...rest }) => rest) });
  }, [updateSettings]);
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const [flushTick, setFlushTick] = useState(0);
  const lastTick = useRef(0);
  useEffect(() => {
    if (!dirty.current) return;
    const immediate = flushTick !== lastTick.current;
    lastTick.current = flushTick;
    const t = setTimeout(() => persistRef.current(), immediate ? 0 : 600);
    return () => clearTimeout(t);
  }, [ranges, flushTick]);
  useEffect(() => () => persistRef.current(), []);
  const markDirty = (now: boolean) => {
    dirty.current = true;
    if (now) setFlushTick((n) => n + 1);
  };

  const updateRange = (index: number, field: keyof RepRangeConfig, value: string | number) => {
    setRanges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    markDirty(field === "color");
  };

  const addRange = () => {
    const last = ranges[ranges.length - 1];
    const newMin = last ? last.max + 1 : 1;
    setRanges((prev) => [
      ...prev,
      withId({
        label: `${newMin}+ reps`,
        min: newMin,
        max: 9999,
        color: "#6B7280",
      }),
    ]);
    markDirty(true);
  };

  const removeRange = (index: number) => {
    if (ranges.length <= 1) return;
    setRanges((prev) => prev.filter((_, i) => i !== index));
    markDirty(true);
  };

  const reset = () => {
    Alert.alert("Reset to Defaults", "Are you sure you want to reset all rep ranges to defaults?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: () => {
          setRanges([...DEFAULT_REP_RANGES].map(withId));
          dirty.current = false;
          updateSettings({ repRanges: null });
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 pb-3 pt-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="active:opacity-60">
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </Pressable>
          <Text className="text-xl font-bold dark:text-zinc-100">Rep Range Colors</Text>
        </View>
        <Pressable onPress={reset} className="active:opacity-60">
          <Text className="text-base text-zinc-400 dark:text-zinc-500">Reset</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {ranges.map((range, i) => (
          <View
            key={range._id}
            className="mx-4 mt-4 overflow-hidden rounded-xl bg-white dark:bg-zinc-900"
          >
            {/* Range header */}
            <View className="flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
              <View className="flex-row items-center gap-2">
                <View
                  className="h-4 w-4 rounded-full border border-zinc-200 dark:border-zinc-700"
                  style={{ backgroundColor: range.color }}
                />
                <Text className="text-base font-semibold dark:text-zinc-100">
                  {range.label || `Range ${i + 1}`}
                </Text>
              </View>
              {ranges.length > 1 && (
                <Pressable onPress={() => removeRange(i)} className="active:opacity-60">
                  <Text className="text-sm text-red-500">Remove</Text>
                </Pressable>
              )}
            </View>

            {/* Label */}
            <View className="flex-row items-center border-b border-zinc-100 dark:border-zinc-800 px-4 py-2.5">
              <Text className="w-20 text-sm text-zinc-400 dark:text-zinc-500">Label</Text>
              <TextInput
                className="flex-1 dark:text-zinc-100"
                style={inlineInput}
                value={range.label}
                onChangeText={(v) => updateRange(i, "label", v)}
                placeholder="Label"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {/* Min */}
            <View className="flex-row items-center border-b border-zinc-100 dark:border-zinc-800 px-4 py-2.5">
              <Text className="w-20 text-sm text-zinc-400 dark:text-zinc-500">Min</Text>
              <TextInput
                className="flex-1 dark:text-zinc-100"
                style={inlineInput}
                value={String(range.min)}
                onChangeText={(v) => updateRange(i, "min", parseInt(v, 10) || 0)}
                keyboardType="number-pad"
              />
            </View>

            {/* Max */}
            <View className="flex-row items-center border-b border-zinc-100 dark:border-zinc-800 px-4 py-2.5">
              <Text className="w-20 text-sm text-zinc-400 dark:text-zinc-500">Max</Text>
              <TextInput
                className="flex-1 dark:text-zinc-100"
                style={inlineInput}
                value={range.max >= 9999 ? "" : String(range.max)}
                onChangeText={(v) => updateRange(i, "max", v ? parseInt(v, 10) || 0 : 9999)}
                keyboardType="number-pad"
                placeholder="No limit"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {errors[i] && (
              <View className="flex-row items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 px-4 py-2">
                <Ionicons name="alert-circle" size={14} color="#F87171" />
                <Text testID={`range-error-${i}`} className="text-sm text-red-400">
                  {errors[i]} · not saved yet
                </Text>
              </View>
            )}

            {/* Color picker */}
            <View className="px-4 py-3">
              <Text className="mb-2 text-sm text-zinc-400 dark:text-zinc-500">Color</Text>
              <View className="flex-row flex-wrap gap-2.5">
                {swatchesFor(range.color).map((s) => {
                  const selected = sameColor(s.color, range.color);
                  return (
                    <Pressable
                      key={s.color}
                      testID={`swatch-${i}-${s.color}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={s.custom ? "Current custom colour" : s.color}
                      onPress={() => updateRange(i, "color", s.color)}
                      hitSlop={4}
                      // Selected: a gap then a white ring, plus a check in whichever ink contrasts
                      // with the swatch, so it reads on every colour including white and grey.
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: selected ? "#FFFFFF" : "transparent",
                      }}
                    >
                      <View
                        style={{
                          width: selected ? 28 : 32,
                          height: selected ? 28 : 32,
                          borderRadius: 16,
                          backgroundColor: s.color,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.15)",
                        }}
                      >
                        {selected && (
                          <Ionicons name="checkmark" size={20} color={contrastOn(s.color)} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {swatchesFor(range.color)[0].custom && (
                <Text className="mt-2 text-xs text-zinc-500">
                  The first swatch is your saved colour from the old palette.
                </Text>
              )}
            </View>
          </View>
        ))}

        {/* Add Range */}
        <View className="mt-4 px-4">
          <Pressable
            onPress={addRange}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 py-3 active:bg-zinc-50 dark:active:bg-zinc-800"
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.accentIcon} />
            <Text className="text-base font-medium text-ember-700 dark:text-ember-500">
              Add Range
            </Text>
          </Pressable>
          <Text className="mt-3 text-center text-xs text-zinc-500">
            Changes save automatically.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
