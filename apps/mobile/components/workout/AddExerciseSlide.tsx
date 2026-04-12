import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SectionList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../../hooks/useThemeColors";
import { useExercises, type Exercise } from "../../hooks/useExercises";
import { useExerciseSuggestions } from "../../hooks/useExerciseSuggestions";
import {
  useFavouriteExercises,
  useToggleFavourite,
} from "../../hooks/useFavouriteExercises";
import { useAllExerciseProfiles } from "../../hooks/useExerciseProfiles";
import { useGymProfileSuggestion } from "../../hooks/useGymProfileSuggestion";
import { useWorkoutActions } from "../../hooks/useWorkoutActions";

interface AddExerciseSlideProps {
  onExerciseAdded?: () => void;
}

export default function AddExerciseSlide({
  onExerciseAdded,
}: AddExerciseSlideProps) {
  const { addExercise } = useWorkoutActions();
  const colors = useThemeColors();
  const [searchText, setSearchText] = useState("");

  const { data: exercises, isLoading } = useExercises(searchText);
  const { data: allProfiles } = useAllExerciseProfiles();
  const { data: favourites } = useFavouriteExercises();
  const toggleFavourite = useToggleFavourite();
  const { getSuggestedProfile, recordProfileUsage } =
    useGymProfileSuggestion();
  const suggestedExerciseIds = useExerciseSuggestions();

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
      if (profiles.length === 2)
        return `${profiles[0].name}, ${profiles[1].name}`;
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

      const displayName = profileToUse
        ? `${exercise.name} (${profileToUse.name})`
        : exercise.name;
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
    [
      allProfiles,
      addExercise,
      onExerciseAdded,
      getSuggestedProfile,
      recordProfileUsage,
    ],
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
      result.push({ title: "Suggested", data: suggestedExercises });
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
  }, [exercises, favourites, suggestedExercises, searchText]);

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
                <Text className="text-xs text-zinc-400 dark:text-zinc-500">
                  ({profilesLabel})
                </Text>
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
      <View className="mx-4 mb-2 flex-row items-center rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-3">
        <Ionicons name="search" size={18} color={colors.mutedIcon} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search exercises..."
          placeholderTextColor={colors.placeholder}
          className="ml-2 flex-1 py-2.5 dark:text-zinc-100"
          style={{ fontSize: 16 }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.mutedIcon} />
          </Pressable>
        )}
      </View>

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
