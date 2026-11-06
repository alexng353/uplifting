import { useMemo } from "react";
import { Text, View } from "react-native";
import { MuscleMap } from "../muscles";
import { useExercises } from "../../hooks/useExercises";
import { heatColours, regionLoad } from "../../lib/muscle-regions";

interface TopExercise {
  id: string;
  total_sets: number;
}

// Unloaded regions: a quiet zinc, so the Ember heat reads at a glance.
const BASE = "#27272a";
const OUTLINE = "#09090b";

/**
 * Front and back heat maps of the muscles your most-done exercises work: sets count
 * fully for primary muscles and half for secondary ones (lib/muscle-regions).
 */
export default function MusclesWorked({ topExercises }: { topExercises: TopExercise[] }) {
  const { data: exercises = [] } = useExercises();
  const colours = useMemo(() => {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    const loads = topExercises.flatMap((t) => {
      const e = byId.get(t.id);
      return e
        ? [
            {
              sets: Number(t.total_sets),
              primary: e.primary_muscles,
              secondary: e.secondary_muscles,
            },
          ]
        : [];
    });
    return heatColours(regionLoad(loads));
  }, [exercises, topExercises]);

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
  return (
    <View testID="muscles-worked">
      <Text className="mx-4 mt-6 mb-2 text-base font-semibold text-zinc-700 dark:text-zinc-200">
        Muscles Worked
      </Text>
      <View className="mx-4 rounded-xl bg-white dark:bg-zinc-900 px-4 py-4">
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
        <Text className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
          From your top exercises: brighter means more sets.
        </Text>
      </View>
    </View>
  );
}
