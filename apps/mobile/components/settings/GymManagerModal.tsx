import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { StoredGym } from "../../services/storage";
import { useThemeColors } from "../../hooks/useThemeColors";
import { requestAndGetPosition } from "../../services/geolocation";

interface GymManagerModalProps {
  visible: boolean;
  onDismiss: () => void;
  gyms: StoredGym[];
  onAddGym: (
    name: string,
    latitude?: number | null,
    longitude?: number | null,
  ) => Promise<StoredGym>;
  onUpdateGym: (id: string, name: string) => Promise<void>;
  onDeleteGym: (id: string) => Promise<void>;
}

export default function GymManagerModal({
  visible,
  onDismiss,
  gyms,
  onAddGym,
  onUpdateGym,
  onDeleteGym,
}: GymManagerModalProps) {
  const colors = useThemeColors();
  const [newGymName, setNewGymName] = useState("");
  const [editingGymId, setEditingGymId] = useState<string | null>(null);
  const [editingGymName, setEditingGymName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const handleCaptureLocation = async () => {
    setCapturingLocation(true);
    try {
      const pos = await requestAndGetPosition();
      if (pos) setCapturedLocation(pos);
    } finally {
      setCapturingLocation(false);
    }
  };

  const handleAdd = async () => {
    if (!newGymName.trim()) return;
    setIsAdding(true);
    try {
      await onAddGym(newGymName.trim(), capturedLocation?.latitude, capturedLocation?.longitude);
      setNewGymName("");
      setCapturedLocation(null);
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (gym: StoredGym) => {
    setEditingGymId(gym.id);
    setEditingGymName(gym.name);
  };

  const handleSaveEdit = async () => {
    if (!editingGymId || !editingGymName.trim()) return;
    await onUpdateGym(editingGymId, editingGymName.trim());
    setEditingGymId(null);
    setEditingGymName("");
  };

  const handleCancelEdit = () => {
    setEditingGymId(null);
    setEditingGymName("");
  };

  const handleDelete = (gym: StoredGym) => {
    Alert.alert(
      "Delete Gym",
      `Are you sure you want to delete "${gym.name}"? This won't delete your workout history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteGym(gym.id),
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white dark:bg-zinc-900"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-4 pb-3 pt-4">
          <Text className="text-xl font-bold dark:text-zinc-100">Manage Gyms</Text>
          <Pressable onPress={onDismiss} className="active:opacity-60">
            <Text className="text-base font-semibold text-blue-500">Done</Text>
          </Pressable>
        </View>

        {/* Add Gym */}
        <View className="border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2.5 text-base dark:text-zinc-100"
              placeholder="New gym name..."
              placeholderTextColor={colors.placeholder}
              value={newGymName}
              onChangeText={setNewGymName}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable
              onPress={handleAdd}
              disabled={!newGymName.trim() || isAdding}
              className={`rounded-lg px-4 py-2.5 ${
                newGymName.trim() && !isAdding
                  ? "bg-blue-500 active:bg-blue-600"
                  : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  newGymName.trim() && !isAdding ? "text-white" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                Add
              </Text>
            </Pressable>
          </View>
          <View className="mt-2 flex-row items-center gap-2">
            {capturedLocation ? (
              <View className="flex-1 flex-row items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
                <Ionicons name="location" size={16} color={colors.accentIcon} />
                <Text className="flex-1 text-sm dark:text-zinc-100">
                  {capturedLocation.latitude.toFixed(4)}, {capturedLocation.longitude.toFixed(4)}
                </Text>
                <Pressable onPress={() => setCapturedLocation(null)} className="active:opacity-60">
                  <Ionicons name="close-circle" size={20} color={colors.mutedIcon} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleCaptureLocation}
                disabled={capturingLocation}
                className="flex-row items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 active:opacity-60"
              >
                {capturingLocation ? (
                  <ActivityIndicator size="small" color={colors.accentIcon} />
                ) : (
                  <Ionicons name="location-outline" size={16} color={colors.accentIcon} />
                )}
                <Text className="text-sm text-blue-500">Use Current Location</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Gym List */}
        {gyms.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="business-outline" size={48} color={colors.mutedIcon} />
            <Text className="mt-3 text-center text-base text-zinc-400 dark:text-zinc-500">
              No gyms added yet. Add a gym to track profile preferences by location.
            </Text>
          </View>
        ) : (
          <FlatList
            data={gyms}
            keyExtractor={(item) => item.id}
            contentContainerClassName="pb-8"
            renderItem={({ item: gym }) => (
              <View className="flex-row items-center border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
                {editingGymId === gym.id ? (
                  <View className="flex-1 flex-row items-center gap-2">
                    <TextInput
                      className="flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-base dark:text-zinc-100"
                      placeholderTextColor={colors.placeholder}
                      value={editingGymName}
                      onChangeText={setEditingGymName}
                      onSubmitEditing={handleSaveEdit}
                      autoFocus
                      returnKeyType="done"
                    />
                    <Pressable onPress={handleSaveEdit} className="active:opacity-60">
                      <Ionicons name="checkmark-circle" size={28} color={colors.successIcon} />
                    </Pressable>
                    <Pressable onPress={handleCancelEdit} className="active:opacity-60">
                      <Ionicons name="close-circle" size={28} color={colors.mutedIcon} />
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View className="flex-1">
                      <Text className="text-base dark:text-zinc-100">{gym.name}</Text>
                      {gym.latitude != null && gym.longitude != null && (
                        <Text className="text-xs text-zinc-400 dark:text-zinc-500">
                          {gym.latitude.toFixed(4)}, {gym.longitude.toFixed(4)}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Pressable onPress={() => handleStartEdit(gym)} className="active:opacity-60">
                        <Ionicons name="pencil" size={20} color={colors.accentIcon} />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(gym)} className="active:opacity-60">
                        <Ionicons name="trash" size={20} color={colors.dangerIcon} />
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
