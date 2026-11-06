import { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, SectionList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useExercises, type Exercise } from "../../hooks/useExercises";
import { useExerciseSuggestions } from "../../hooks/useExerciseSuggestions";
import { useFavouriteExercises, useToggleFavourite } from "../../hooks/useFavouriteExercises";
import { useAllExerciseProfiles } from "../../hooks/useExerciseProfiles";
import { useGymProfileSuggestion } from "../../hooks/useGymProfileSuggestion";
import { useWorkoutActions } from "../../hooks/useWorkoutActions";
import SearchField from "../SearchField";
import { useOptionalWorkout } from "../../hooks/useWorkout";
import { getDayTypes } from "../../services/storage";

interface AddExerciseSlideProps {
  onExerciseAdded?: () => void;
}

export default function AddExerciseSlide({ onExerciseAdded }: AddExerciseSlideProps) {
  const { addExercise, mode } = useWorkoutActions();
  const colors = useThemeColors();
  const [searchText, setSearchText] = useState("");

  const { data: exercises, isLoading } = useExercises(searchText);
  const { data: allProfiles } = useAllExerciseProfiles();
  const { data: favourites } = useFavouriteExercises();
  const toggleFavourite = useToggleFavourite();
  const { getSuggestedProfile, recordProfileUsage } = useGymProfileSuggestion();
  const suggestedExerciseIds = useExerciseSuggestions();
  const live = useOptionalWorkout();
  const day = useMemo(() => {
    const id = mode === "live" ? live?.workout?.dayTypeId : undefined;
    return id ? getDayTypes()?.find((d) => d.id === id) : undefined;
  }, [mode, live?.workout?.dayTypeId]);
  const inWorkout = useMemo(
    () => new Set(live?.workout?.exercises.map((e) => e.exerciseId) ?? []),
    [live?.workout?.exercises],
  );

  const handleToggleFavourite = useCallback(
    (exerciseId: string) => {
      const isFavourite = favourites?.has(exerciseId) ?? false;
      toggleFavourite.mutate({ exerciseId, isFavourite });
    },
    [favourites, toggleFavourite],
  );

  const getProfilesLabel = useCallback(
    (exerciseId: string) => {
      const profiles = allProfiles?.get(exerciseId);
      if (!profiles || profiles.length === 0) return null;
      if (profiles.length === 1) return profiles[0].name as string;
      if (profiles.length === 2) return `${profiles[0].name}, ${profiles[1].name}`;
      return `${profiles[0].name}, +${profiles.length - 1}`;
    },
    [allProfiles],
  );

  // Quick add with last-used-at-this-location profile, or default
  const handleQuickAdd = useCallback(
    (exercise: Exercise) => {
      const profiles = allProfiles?.get(exercise.id);

      const suggestedProfileId = getSuggestedProfile(exercise.id);
      const profileToUse = suggestedProfileId
        ? profiles?.find((p: any) => p.id === suggestedProfileId)
        : undefined;

      const displayName = profileToUse ? `${exercise.name} (${profileToUse.name})` : exercise.name;
      addExercise(
        exercise.id,
        displayName,
        profileToUse?.id as string | undefined,
        exercise.exercise_type,
      );

      if (profileToUse?.id) {
        recordProfileUsage(exercise.id, profileToUse.id as string);
      }

      setSearchText("");
      onExerciseAdded?.();
    },
    [allProfiles, addExercise, onExerciseAdded, getSuggestedProfile, recordProfileUsage],
  );

  // Build a lookup map for suggested exercises
  const suggestedExercises = useMemo(() => {
    if (!exercises || suggestedExerciseIds.length === 0) return [];
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
    return suggestedExerciseIds
      .map((id) => exerciseMap.get(id))
      .filter((e): e is Exercise => e !== undefined);
  }, [exercises, suggestedExerciseIds]);

  // Group exercises into sections for SectionList
  const sections = useMemo(() => {
    if (!exercises) return [];

    // When searching, preserve the relevance order from useExercises (exact /
    // phrase / alias matches first) instead of re-sorting alphabetically.
    if (searchText.trim()) {
      return exercises.length > 0 ? [{ title: "Results", data: exercises }] : [];
    }

    const result: { title: string; data: Exercise[] }[] = [];
    const favs: Exercise[] = [];
    const grouped: Record<string, Exercise[]> = {};

    // Sort exercises: favourites first, then alphabetically
    const sorted = [...exercises].sort((a, b) => {
      const aFav = favourites?.has(a.id) ?? false;
      const bFav = favourites?.has(b.id) ?? false;
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const exercise of sorted) {
      if (favourites?.has(exercise.id)) {
        favs.push(exercise);
      } else {
        const letter = exercise.name[0]?.toUpperCase() ?? "#";
        if (!grouped[letter]) {
          grouped[letter] = [];
        }
        grouped[letter].push(exercise);
      }
    }

    // Suggested section
    if (suggestedExercises.length > 0 && !searchText) {
      result.push({
        title: day ? `Suggested for ${day.name}` : "Suggested",
        data: suggestedExercises,
      });
    }

    // Favourites section
    if (favs.length > 0) {
      result.push({ title: "Favourites", data: favs });
    }

    // Alphabetical sections
    const letters = Object.keys(grouped).sort();
    for (const letter of letters) {
      result.push({ title: letter, data: grouped[letter] });
    }

    return result;
  }, [exercises, favourites, suggestedExercises, searchText, day]);

  // One tap adds the rest of the day's list, in order.
  const remaining = useMemo(() => {
    if (!day || !exercises) return [];
    const byId = new Map(exercises.map((e) => [e.id, e]));
    return day.exerciseIds
      .filter((id) => !inWorkout.has(id))
      .map((id) => byId.get(id))
      .filter((e): e is Exercise => !!e);
  }, [day, exercises, inWorkout]);

  const renderExerciseRow = useCallback(
    ({ item: exercise }: { item: Exercise }) => {
      const profilesLabel = getProfilesLabel(exercise.id);
      const isFavourite = favourites?.has(exercise.id) ?? false;

      return (
        <Pressable
          onPress={() => handleQuickAdd(exercise)}
          className="flex-row items-center border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 active:bg-zinc-50 dark:active:bg-zinc-800"
        >
          {/* Favourite toggle */}
          <Pressable
            onPress={() => handleToggleFavourite(exercise.id)}
            hitSlop={8}
            className="mr-3"
          >
            <Ionicons
              name={isFavourite ? "star" : "star-outline"}
              size={20}
              color={isFavourite ? colors.warningIcon : colors.mutedIcon}
            />
          </Pressable>

          {/* Exercise info */}
          <View className="flex-1">
            <Text className="text-base font-medium dark:text-zinc-100">{exercise.name}</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-zinc-400 dark:text-zinc-500">
                {exercise.exercise_type}
              </Text>
              {profilesLabel && (
                <Text className="text-xs text-zinc-400 dark:text-zinc-500">({profilesLabel})</Text>
              )}
            </View>
          </View>

          {/* Add button */}
          <Ionicons name="add-circle-outline" size={24} color={colors.accentIcon} />
        </Pressable>
      );
    },
    [favourites, getProfilesLabel, handleQuickAdd, handleToggleFavourite],
  );

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900 px-0 pt-2">
      <Text className="mb-2 px-4 text-xl font-bold dark:text-zinc-100">Add Exercise</Text>

      {/* Search bar */}
      <SearchField
        boxTestID="exercise-search-box"
        testID="exercise-search"
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search exercises..."
      />

      {day && remaining.length > 0 && !searchText && (
        <Pressable
          testID="add-day-list"
          onPress={() => remaining.forEach((e) => handleQuickAdd(e))}
          className="mx-4 mb-2 flex-row items-center justify-center gap-2 rounded-lg border border-ember-500 py-2.5 active:bg-ember-500/10"
        >
          <Ionicons name="list" size={18} color={colors.accentIcon} />
          <Text className="text-sm font-semibold text-ember-700 dark:text-ember-400">
            Add the rest of {day.name} ({remaining.length})
          </Text>
        </Pressable>
      )}

      {/* Exercise list */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-zinc-400 dark:text-zinc-500">Loading exercises...</Text>
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-zinc-400 dark:text-zinc-500">No exercises found</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseRow}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-zinc-100 dark:bg-zinc-800 px-4 py-1.5">
              <Text className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">
                {title}
              </Text>
            </View>
          )}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}
