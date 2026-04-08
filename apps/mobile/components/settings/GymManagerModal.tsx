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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { StoredGym } from "../../services/storage";

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
  const [newGymName, setNewGymName] = useState("");
  const [editingGymId, setEditingGymId] = useState<string | null>(null);
  const [editingGymName, setEditingGymName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newGymName.trim()) return;
    setIsAdding(true);
    try {
      await onAddGym(newGymName.trim());
      setNewGymName("");
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
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-zinc-200 px-4 pb-3 pt-4">
          <Text className="text-xl font-bold">Manage Gyms</Text>
          <Pressable onPress={onDismiss} className="active:opacity-60">
            <Text className="text-base font-semibold text-blue-500">Done</Text>
          </Pressable>
        </View>

        {/* Add Gym */}
        <View className="flex-row items-center gap-2 border-b border-zinc-100 px-4 py-3">
          <TextInput
            className="flex-1 rounded-lg bg-zinc-100 px-3 py-2.5 text-base"
            placeholder="New gym name..."
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
                : "bg-zinc-200"
            }`}
          >
            <Text
              className={`text-base font-semibold ${
                newGymName.trim() && !isAdding ? "text-white" : "text-zinc-400"
              }`}
            >
              Add
            </Text>
          </Pressable>
        </View>

        {/* Gym List */}
        {gyms.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="business-outline" size={48} color="#a1a1aa" />
            <Text className="mt-3 text-center text-base text-zinc-400">
              No gyms added yet. Add a gym to track profile preferences by
              location.
            </Text>
          </View>
        ) : (
          <FlatList
            data={gyms}
            keyExtractor={(item) => item.id}
            contentContainerClassName="pb-8"
            renderItem={({ item: gym }) => (
              <View className="flex-row items-center border-b border-zinc-100 px-4 py-3">
                {editingGymId === gym.id ? (
                  <View className="flex-1 flex-row items-center gap-2">
                    <TextInput
                      className="flex-1 rounded-lg bg-zinc-100 px-3 py-2 text-base"
                      value={editingGymName}
                      onChangeText={setEditingGymName}
                      onSubmitEditing={handleSaveEdit}
                      autoFocus
                      returnKeyType="done"
                    />
                    <Pressable
                      onPress={handleSaveEdit}
                      className="active:opacity-60"
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={28}
                        color="#22c55e"
                      />
                    </Pressable>
                    <Pressable
                      onPress={handleCancelEdit}
                      className="active:opacity-60"
                    >
                      <Ionicons
                        name="close-circle"
                        size={28}
                        color="#a1a1aa"
                      />
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View className="flex-1">
                      <Text className="text-base">{gym.name}</Text>
                      {gym.latitude != null && gym.longitude != null && (
                        <Text className="text-xs text-zinc-400">
                          {gym.latitude.toFixed(4)}, {gym.longitude.toFixed(4)}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => handleStartEdit(gym)}
                        className="active:opacity-60"
                      >
                        <Ionicons name="pencil" size={20} color="#3b82f6" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(gym)}
                        className="active:opacity-60"
                      >
                        <Ionicons name="trash" size={20} color="#ef4444" />
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
