import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  useAllExerciseProfiles,
  useRenameExerciseProfile,
} from "../../../hooks/useExerciseProfiles";
import { useExercises } from "../../../hooks/useExercises";

interface ProfileItem {
  exerciseId: string;
  profileId: string;
  profileName: string;
}

interface ProfileSection {
  title: string;
  exerciseId: string;
  data: ProfileItem[];
}

export default function ExerciseProfilesScreen() {
  const router = useRouter();
  const { data: allProfiles } = useAllExerciseProfiles();
  const { data: exercises } = useExercises();
  const renameProfileMutation = useRenameExerciseProfile();

  const [searchText, setSearchText] = useState("");

  // Rename profile state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameData, setRenameData] = useState<{
    exerciseId: string;
    profileId: string;
    currentName: string;
  } | null>(null);
  const [newProfileName, setNewProfileName] = useState("");

  // Build sections
  const sections = useMemo((): ProfileSection[] => {
    if (!allProfiles || !exercises) return [];

    const items: {
      exerciseId: string;
      exerciseName: string;
      profileId: string;
      profileName: string;
    }[] = [];

    for (const [exerciseId, profiles] of allProfiles.entries()) {
      const exercise = exercises.find((e) => e.id === exerciseId);
      const exerciseName = exercise?.name ?? "Unknown exercise";
      for (const profile of profiles) {
        const pid = profile.id ?? profile.profile_id;
        const pname = profile.name ?? profile.profile_name ?? "Default";
        items.push({
          exerciseId,
          exerciseName,
          profileId: pid,
          profileName: pname,
        });
      }
    }

    // Filter by search text
    const query = searchText.trim().toLowerCase();
    const filtered = query
      ? items.filter(
          (item) =>
            item.exerciseName.toLowerCase().includes(query) ||
            item.profileName.toLowerCase().includes(query),
        )
      : items;

    // Sort
    filtered.sort((a, b) => {
      const cmp = a.exerciseName.localeCompare(b.exerciseName);
      if (cmp !== 0) return cmp;
      return a.profileName.localeCompare(b.profileName);
    });

    // Group by exercise
    const groups = new Map<
      string,
      { exerciseName: string; profiles: ProfileItem[] }
    >();

    for (const item of filtered) {
      const existing = groups.get(item.exerciseId);
      if (existing) {
        existing.profiles.push({
          exerciseId: item.exerciseId,
          profileId: item.profileId,
          profileName: item.profileName,
        });
      } else {
        groups.set(item.exerciseId, {
          exerciseName: item.exerciseName,
          profiles: [
            {
              exerciseId: item.exerciseId,
              profileId: item.profileId,
              profileName: item.profileName,
            },
          ],
        });
      }
    }

    return Array.from(groups.entries()).map(
      ([exerciseId, { exerciseName, profiles }]) => ({
        title: exerciseName,
        exerciseId,
        data: profiles,
      }),
    );
  }, [allProfiles, exercises, searchText]);

  const handleOpenRename = useCallback(
    (exerciseId: string, profileId: string, currentName: string) => {
      setRenameData({ exerciseId, profileId, currentName });
      setNewProfileName(currentName);
      setShowRenameModal(true);
    },
    [],
  );

  const handleSaveProfileName = useCallback(async () => {
    if (!renameData || !newProfileName.trim()) return;
    try {
      await renameProfileMutation.mutateAsync({
        exerciseId: renameData.exerciseId,
        profileId: renameData.profileId,
        name: newProfileName.trim(),
      });
      setShowRenameModal(false);
    } catch {
      Alert.alert("Error", "Failed to rename profile.");
    }
  }, [renameData, newProfileName, renameProfileMutation]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-zinc-200 bg-white px-4 pb-3 pt-4">
        <Pressable onPress={() => router.back()} className="active:opacity-60">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold">Exercise Profiles</Text>
      </View>

      {/* Search */}
      <View className="bg-white px-4 py-2">
        <View className="flex-row items-center rounded-lg bg-zinc-100 px-3 py-2">
          <Ionicons name="search" size={18} color="#a1a1aa" />
          <TextInput
            className="ml-2 flex-1 text-base"
            placeholder="Filter by exercise or profile name"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color="#a1a1aa" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Profile List */}
      {sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="barbell-outline" size={48} color="#a1a1aa" />
          <Text className="mt-3 text-center text-base text-zinc-400">
            {searchText.trim()
              ? "No profiles match your search."
              : "No exercise profiles yet."}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.exerciseId}_${item.profileId}`}
          contentContainerClassName="pb-8"
          renderSectionHeader={({ section }) => (
            <View className="bg-zinc-50 px-4 pb-1 pt-4">
              <Text className="text-sm font-semibold text-zinc-400">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <Pressable
              onPress={() =>
                handleOpenRename(
                  item.exerciseId,
                  item.profileId,
                  item.profileName,
                )
              }
              className={`flex-row items-center bg-white px-4 py-3 active:bg-zinc-50 ${
                index < section.data.length - 1
                  ? "border-b border-zinc-100"
                  : ""
              }`}
            >
              <Ionicons name="barbell" size={20} color="#3b82f6" />
              <Text className="ml-3 flex-1 text-base">{item.profileName}</Text>
              <Ionicons name="chevron-forward" size={16} color="#a1a1aa" />
            </Pressable>
          )}
        />
      )}

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-white"
        >
          <View className="flex-row items-center justify-between border-b border-zinc-200 px-4 pb-3 pt-4">
            <Text className="text-xl font-bold">Rename Profile</Text>
            <Pressable
              onPress={() => setShowRenameModal(false)}
              className="active:opacity-60"
            >
              <Text className="text-base text-zinc-400">Cancel</Text>
            </Pressable>
          </View>
          <View className="p-4">
            <Text className="mb-2 text-sm font-medium text-zinc-500">
              Profile Name
            </Text>
            <TextInput
              className="rounded-lg bg-zinc-100 px-4 py-3 text-base"
              value={newProfileName}
              onChangeText={setNewProfileName}
              autoFocus
            />
            <Pressable
              onPress={handleSaveProfileName}
              disabled={
                renameProfileMutation.isPending || !newProfileName.trim()
              }
              className={`mt-4 items-center rounded-lg py-3 ${
                renameProfileMutation.isPending || !newProfileName.trim()
                  ? "bg-zinc-200"
                  : "bg-blue-500 active:bg-blue-600"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  renameProfileMutation.isPending || !newProfileName.trim()
                    ? "text-zinc-400"
                    : "text-white"
                }`}
              >
                {renameProfileMutation.isPending ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
