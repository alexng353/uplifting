import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useDayTypes } from "../../../hooks/useDayTypes";
import { useExercises } from "../../../hooks/useExercises";
import { useThemeColors } from "../../../hooks/useThemeColors";
import { listFromSessions, sessionsForDay, type DayType } from "../../../lib/day-types";
import { generateId, getExerciseSequences } from "../../../services/storage";
import { inlineInput } from "../../../lib/input-style";

// Row icons sit in a 36x32 box with slop to a 44pt target. They are 8pt apart (gap-2),
// so the side slop meets without overlapping, and the vertical slop stays inside the
// row's own padding. Before this they were 30pt, and "remove" sat beside "move down".
const ROW_ICON_HIT_SLOP = { top: 6, bottom: 6, left: 4, right: 4 };

/**
 * Day types (Upper, Lower, ...): name and ordered exercise list. Changes save as you
 * make them. "Update from history" rebuilds a list from the last few sessions of that day.
 */
export default function DayTypesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { days, save } = useDayTypes();
  const { data: exercises = [] } = useExercises();
  const nameOf = useMemo(() => new Map(exercises.map((e) => [e.id, e.name])), [exercises]);
  const [newName, setNewName] = useState("");

  const update = (i: number, day: DayType) => save(days.map((d, j) => (j === i ? day : d)));
  const move = (i: number, from: number, by: -1 | 1) => {
    const ids = [...days[i].exerciseIds];
    const to = from + by;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    update(i, { ...days[i], exerciseIds: ids });
  };
  const fromHistory = (i: number) => {
    const sessions = sessionsForDay(days[i], getExerciseSequences()).slice(0, 4);
    if (sessions.length === 0) {
      Alert.alert("No history yet", `Finish a workout titled "${days[i].name}" first.`);
      return;
    }
    const ids = listFromSessions(sessions);
    Alert.alert(
      `Update ${days[i].name}?`,
      `From your last ${sessions.length} ${days[i].name} sessions:\n${ids.map((id) => nameOf.get(id) ?? "?").join("\n")}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Update", onPress: () => update(i, { ...days[i], exerciseIds: ids }) },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 pb-3 pt-4">
        <Pressable onPress={() => router.back()} className="active:opacity-60">
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </Pressable>
        <Text className="text-xl font-bold dark:text-zinc-100">Day Types</Text>
      </View>
      <ScrollView contentContainerClassName="pb-10">
        {days.map((day, i) => (
          <View
            key={day.id}
            testID={`day-${day.name}`}
            className="mx-4 mt-4 rounded-xl bg-white dark:bg-zinc-900"
          >
            <View className="flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
              <TextInput
                value={day.name}
                onChangeText={(name) => update(i, { ...day, name })}
                className="flex-1 text-base font-semibold dark:text-zinc-100"
                style={inlineInput}
                selectionColor={colors.caret}
              />
              <Pressable
                onPress={() => save(days.filter((_, j) => j !== i))}
                hitSlop={8}
                className="active:opacity-60"
              >
                <Text className="text-sm text-red-500">Remove</Text>
              </Pressable>
            </View>
            {day.exerciseIds.length === 0 && (
              <Text className="px-4 py-3 text-sm text-zinc-500">No exercises yet.</Text>
            )}
            {day.exerciseIds.map((id, k) => (
              <View
                key={id}
                className="flex-row items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 px-4 py-2.5"
              >
                <Text className="w-5 text-sm text-zinc-500">{k + 1}</Text>
                <Text className="flex-1 text-base dark:text-zinc-100" numberOfLines={1}>
                  {nameOf.get(id) ?? "Unknown exercise"}
                </Text>
                <Pressable
                  onPress={() => move(i, k, -1)}
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${nameOf.get(id) ?? "exercise"} up`}
                  hitSlop={ROW_ICON_HIT_SLOP}
                  className="h-8 w-9 items-center justify-center"
                >
                  <Ionicons name="chevron-up" size={18} color={colors.mutedIcon} />
                </Pressable>
                <Pressable
                  onPress={() => move(i, k, 1)}
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${nameOf.get(id) ?? "exercise"} down`}
                  hitSlop={ROW_ICON_HIT_SLOP}
                  className="h-8 w-9 items-center justify-center"
                >
                  <Ionicons name="chevron-down" size={18} color={colors.mutedIcon} />
                </Pressable>
                <Pressable
                  onPress={() =>
                    update(i, { ...day, exerciseIds: day.exerciseIds.filter((x) => x !== id) })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${nameOf.get(id) ?? "exercise"} from this day`}
                  hitSlop={ROW_ICON_HIT_SLOP}
                  className="h-8 w-9 items-center justify-center"
                >
                  <Ionicons name="close" size={18} color={colors.dangerIcon} />
                </Pressable>
              </View>
            ))}
            <Pressable
              testID={`day-history-${day.name}`}
              onPress={() => fromHistory(i)}
              className="flex-row items-center gap-2 px-4 py-3 active:opacity-60"
            >
              <Ionicons name="refresh" size={16} color={colors.accentIcon} />
              <Text className="text-sm font-medium text-ember-700 dark:text-ember-500">
                Update from last sessions
              </Text>
            </Pressable>
          </View>
        ))}
        <View className="mx-4 mt-4 flex-row items-center gap-2">
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="New day, e.g. Push"
            placeholderTextColor={colors.placeholder}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 dark:text-zinc-100"
            style={[inlineInput, { height: 40 }]}
            selectionColor={colors.caret}
          />
          <Pressable
            disabled={!newName.trim()}
            onPress={() => {
              save([...days, { id: generateId(), name: newName.trim(), exerciseIds: [] }]);
              setNewName("");
            }}
            className="rounded-lg bg-ember-500 px-4 py-2.5 active:bg-ember-600"
            style={{ opacity: newName.trim() ? 1 : 0.4 }}
          >
            <Text className="font-semibold text-ember-ink">Add</Text>
          </Pressable>
        </View>
        <Text className="mx-4 mt-3 text-xs text-zinc-500">
          Starting a workout picks the next day in this order. Its list leads the exercise
          suggestions. Changes save automatically.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
