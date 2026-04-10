import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSearchUsers } from "../../hooks/useSearchUsers";
import { useSendFriendRequest } from "../../hooks/useSendFriendRequest";
import { useThemeColors } from "../../hooks/useThemeColors";

interface FriendSearchProps {
  visible: boolean;
  onClose: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FriendSearch({ visible, onClose }: FriendSearchProps) {
  const [searchText, setSearchText] = useState("");
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const colors = useThemeColors();

  const { data: results = [], isLoading: isSearching } =
    useSearchUsers(searchText);
  const sendFriendRequest = useSendFriendRequest();

  const handleSendRequest = useCallback(
    async (userId: string) => {
      await sendFriendRequest.mutateAsync(userId);
      setSentRequests((prev) => new Set([...prev, userId]));
    },
    [sendFriendRequest],
  );

  const handleClose = useCallback(() => {
    setSearchText("");
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-4 pb-3 pt-4">
          <Text className="text-xl font-bold dark:text-zinc-100">Find Friends</Text>
          <Pressable onPress={handleClose}>
            <Text className="text-base font-medium text-blue-500">Done</Text>
          </Pressable>
        </View>

        {/* Search bar */}
        <View className="px-4 py-3">
          <View className="flex-row items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2.5">
            <Ionicons name="search" size={18} color={colors.mutedIcon} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by username..."
              className="ml-2 flex-1 text-base dark:text-zinc-100"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color={colors.mutedIcon} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Results */}
        {isSearching ? (
          <View className="flex-1 items-center pt-8">
            <ActivityIndicator size="small" />
            <Text className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">Searching...</Text>
          </View>
        ) : (results ?? []).length === 0 && searchText.trim().length > 0 ? (
          <View className="flex-1 items-center pt-8">
            <Text className="text-base text-zinc-400 dark:text-zinc-500">No users found</Text>
          </View>
        ) : (
          <FlatList
            data={results ?? []}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="px-4"
            renderItem={({ item }) => (
              <View className="flex-row items-center border-b border-zinc-100 dark:border-zinc-800 py-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                  <Text className="text-sm font-bold text-white">
                    {getInitials(item.real_name || item.username)}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium dark:text-zinc-100">
                    {item.real_name}
                  </Text>
                  <Text className="text-sm text-zinc-400 dark:text-zinc-500">
                    @{item.username}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleSendRequest(item.id)}
                  disabled={sentRequests.has(item.id)}
                  className={`rounded-lg px-3 py-1.5 ${
                    sentRequests.has(item.id) ? "bg-zinc-100 dark:bg-zinc-800" : "bg-blue-500"
                  }`}
                >
                  {sentRequests.has(item.id) ? (
                    <Text className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                      Sent
                    </Text>
                  ) : (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="person-add" size={14} color="white" />
                      <Text className="text-sm font-medium text-white">
                        Add
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
