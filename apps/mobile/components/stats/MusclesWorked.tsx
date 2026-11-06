import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MuscleMap } from "../muscles";
import { useExercises } from "../../hooks/useExercises";
import { heatColours, regionLoad } from "../../lib/muscle-regions";

export interface ExerciseSets {
  id: string;
  sets: number;
}

// Unloaded regions: a quiet zinc, so the Ember heat reads at a glance.
const BASE = "#27272a";
const OUTLINE = "#09090b";

/**
 * Front and back heat maps of the muscles a set of exercises works: sets count fully for
 * primary muscles and half for secondary ones (lib/muscle-regions). Stats → All Time feeds
 * it your top exercises; Me feeds it this week's sets.
 */
export default function MusclesWorked({
  exercises: done,
  title = "Muscles Worked",
  caption = "From your top exercises: brighter means more sets.",
  onPress,
  embedded = false,
  testID = "muscles-worked",
}: {
  exercises: readonly ExerciseSets[];
  title?: string;
  caption?: string;
  /** Makes the card tappable, with a chevron by the title. */
  onPress?: () => void;
  /** Inside a screen that already pads its content: no side margins, title inside the card. */
  embedded?: boolean;
  testID?: string;
}) {
  const { data: exercises = [] } = useExercises();
  const colours = useMemo(() => {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    const loads = done.flatMap((t) => {
      const e = byId.get(t.id);
      return e
        ? [
            {
              sets: Number(t.sets),
              primary: e.primary_muscles,
              secondary: e.secondary_muscles,
            },
          ]
        : [];
    });
    return heatColours(regionLoad(loads));
  }, [exercises, done]);

  if (colours.length === 0) return null;
  const map = (view: "front" | "back") => (
    <MuscleMap
      muscles={colours}
      view={view}
      defaultColour={BASE}
      outlineColour={OUTLINE}
      width={130}
      height={255}
    />
  );
  const body = (
    <>
      {embedded && (
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-semibold dark:text-zinc-100">{title}</Text>
          {onPress && <Ionicons name="chevron-forward" size={16} color="#71717a" />}
        </View>
      )}
      <View className="flex-row justify-around">
        <View className="items-center">
          {map("front")}
          <Text className="mt-1 text-xs uppercase text-zinc-400">Front</Text>
        </View>
        <View className="items-center">
          {map("back")}
          <Text className="mt-1 text-xs uppercase text-zinc-400">Back</Text>
        </View>
      </View>
      <Text className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">{caption}</Text>
    </>
  );
  const cardClass = embedded
    ? "mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4"
    : "mx-4 rounded-xl bg-white dark:bg-zinc-900 px-4 py-4";
  const card = onPress ? (
    <Pressable
      testID={`${testID}-card`}
      accessibilityRole="button"
      accessibilityLabel={`${title}, open stats`}
      onPress={onPress}
      className={`${cardClass} active:opacity-80`}
    >
      {body}
    </Pressable>
  ) : (
    <View className={cardClass}>{body}</View>
  );
  return (
    <View testID={testID}>
      {!embedded && (
        <Text className="mx-4 mt-6 mb-2 text-base font-semibold text-zinc-700 dark:text-zinc-200">
          {title}
        </Text>
      )}
      {card}
    </View>
  );
}
