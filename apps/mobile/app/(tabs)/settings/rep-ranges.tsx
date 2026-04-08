import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useSettings } from "../../../hooks/useSettings";
import {
  DEFAULT_REP_RANGES,
  type RepRangeConfig,
} from "../../../services/storage";

type RangeWithId = RepRangeConfig & { _id: number };

let nextRangeId = 0;
function withId(range: RepRangeConfig): RangeWithId {
  return { ...range, _id: nextRangeId++ };
}

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#ffffff",
];

export default function RepRangesScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const [ranges, setRanges] = useState<RangeWithId[]>(() =>
    (settings.repRanges ?? [...DEFAULT_REP_RANGES]).map(withId),
  );
  const [hasChanges, setHasChanges] = useState(false);

  const updateRange = (
    index: number,
    field: keyof RepRangeConfig,
    value: string | number,
  ) => {
    setRanges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setHasChanges(true);
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
        color: "#6b7280",
      }),
    ]);
    setHasChanges(true);
  };

  const removeRange = (index: number) => {
    if (ranges.length <= 1) return;
    setRanges((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const save = () => {
    updateSettings({
      repRanges: ranges.map(({ _id, ...rest }) => rest),
    });
    setHasChanges(false);
    Alert.alert("Saved", "Rep range colors have been saved.");
  };

  const reset = () => {
    Alert.alert(
      "Reset to Defaults",
      "Are you sure you want to reset all rep ranges to defaults?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            setRanges([...DEFAULT_REP_RANGES].map(withId));
            updateSettings({ repRanges: null });
            setHasChanges(false);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-zinc-200 bg-white px-4 pb-3 pt-4">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="active:opacity-60"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text className="text-xl font-bold">Rep Range Colors</Text>
        </View>
        <Pressable onPress={reset} className="active:opacity-60">
          <Text className="text-base text-zinc-400">Reset</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {ranges.map((range, i) => (
          <View key={range._id} className="mx-4 mt-4 overflow-hidden rounded-xl bg-white">
            {/* Range header */}
            <View className="flex-row items-center justify-between border-b border-zinc-100 px-4 py-3">
              <View className="flex-row items-center gap-2">
                <View
                  className="h-4 w-4 rounded-full border border-zinc-200"
                  style={{ backgroundColor: range.color }}
                />
                <Text className="text-base font-semibold">
                  {range.label || `Range ${i + 1}`}
                </Text>
              </View>
              {ranges.length > 1 && (
                <Pressable
                  onPress={() => removeRange(i)}
                  className="active:opacity-60"
                >
                  <Text className="text-sm text-red-500">Remove</Text>
                </Pressable>
              )}
            </View>

            {/* Label */}
            <View className="flex-row items-center border-b border-zinc-100 px-4 py-2.5">
              <Text className="w-20 text-sm text-zinc-400">Label</Text>
              <TextInput
                className="flex-1 text-base"
                value={range.label}
                onChangeText={(v) => updateRange(i, "label", v)}
                placeholder="Label"
              />
            </View>

            {/* Min */}
            <View className="flex-row items-center border-b border-zinc-100 px-4 py-2.5">
              <Text className="w-20 text-sm text-zinc-400">Min</Text>
              <TextInput
                className="flex-1 text-base"
                value={String(range.min)}
                onChangeText={(v) =>
                  updateRange(i, "min", parseInt(v, 10) || 0)
                }
                keyboardType="number-pad"
              />
            </View>

            {/* Max */}
            <View className="flex-row items-center border-b border-zinc-100 px-4 py-2.5">
              <Text className="w-20 text-sm text-zinc-400">Max</Text>
              <TextInput
                className="flex-1 text-base"
                value={range.max >= 9999 ? "" : String(range.max)}
                onChangeText={(v) =>
                  updateRange(i, "max", v ? parseInt(v, 10) || 0 : 9999)
                }
                keyboardType="number-pad"
                placeholder="No limit"
              />
            </View>

            {/* Color picker */}
            <View className="px-4 py-3">
              <Text className="mb-2 text-sm text-zinc-400">Color</Text>
              <View className="flex-row flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => updateRange(i, "color", color)}
                    className={`h-8 w-8 rounded-full border-2 ${
                      range.color === color
                        ? "border-blue-500"
                        : "border-zinc-200"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* Add Range */}
        <View className="mt-4 px-4">
          <Pressable
            onPress={addRange}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white py-3 active:bg-zinc-50"
          >
            <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
            <Text className="text-base font-medium text-blue-500">
              Add Range
            </Text>
          </Pressable>
        </View>

        {/* Save */}
        {hasChanges && (
          <View className="mt-4 px-4">
            <Pressable
              onPress={save}
              className="items-center rounded-xl bg-blue-500 py-3 active:bg-blue-600"
            >
              <Text className="text-base font-semibold text-white">
                Save Changes
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
