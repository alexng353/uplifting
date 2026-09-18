import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useExerciseAgent } from "../../../../hooks/useExerciseAgent";
import { canFollowUp, isGenerating } from "../../../../lib/exercise-agent";

export default function ExerciseAgentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { enabled, session, action } = useExerciseAgent(id);
  const [message, setMessage] = useState("");
  const draft = session.data;
  async function followUp() {
    if (!draft) return;
    try {
      await action.mutateAsync({
        type: "follow-up",
        message: message.trim(),
        revision: draft.revision,
      });
      setMessage("");
    } catch {}
  }
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-zinc-900" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.replace("/(tabs)/settings/exercise-agent")}>
          <Text className="text-blue-500">All drafts</Text>
        </Pressable>
        <Text className="text-2xl font-bold dark:text-zinc-100">Review exercise</Text>
        {!enabled ? (
          <Text className="dark:text-zinc-100">Administrator access required.</Text>
        ) : (
          <>
            {session.isLoading && <ActivityIndicator />}
            {session.error && (
              <Pressable onPress={() => session.refetch()}>
                <Text className="text-red-500">Could not load this draft. Tap to retry.</Text>
              </Pressable>
            )}
            {draft && (
              <>
                <Text className="text-gray-500 dark:text-zinc-400">
                  {draft.status.replaceAll("_", " ")} · Revision {draft.revision}
                </Text>
                {isGenerating(draft.status) && (
                  <View className="flex-row gap-3">
                    <ActivityIndicator />
                    <Text className="flex-1 dark:text-zinc-100">
                      Generating. You can leave this screen and return later.
                    </Text>
                  </View>
                )}
                {draft.messages.map((item, index) => (
                  <View key={index} className="rounded-xl bg-white dark:bg-zinc-800 p-4">
                    <Text className="mb-1 text-xs text-gray-500">
                      {item.role === "user" ? "You" : "Assistant"}
                    </Text>
                    <Text selectable className="dark:text-zinc-100">
                      {item.content}
                    </Text>
                  </View>
                ))}
                {draft.error && <Text className="text-red-500">{draft.error}</Text>}
                {draft.draft && (
                  <View className="rounded-xl bg-white dark:bg-zinc-800 p-4 gap-3">
                    <Text className="font-bold dark:text-zinc-100">
                      Proposed exercise · Revision {draft.revision}
                    </Text>
                    {Object.entries(draft.draft).map(([field, value]) => (
                      <View key={field}>
                        <Text className="text-xs uppercase text-gray-500">
                          {field.replaceAll("_", " ")}
                        </Text>
                        <Text selectable className="dark:text-zinc-100">
                          {Array.isArray(value) ? value.join(", ") || "None" : value || "None"}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {canFollowUp(draft.status) && (
                  <>
                    <TextInput
                      accessibilityLabel="Follow-up instructions"
                      value={message}
                      onChangeText={setMessage}
                      multiline
                      maxLength={4000}
                      placeholder="Ask a question or request changes…"
                      placeholderTextColor="#71717a"
                      className="rounded-xl border border-gray-300 dark:border-zinc-600 p-4 dark:text-zinc-100"
                    />
                    <Pressable
                      disabled={action.isPending || !message.trim()}
                      onPress={followUp}
                      className="rounded-xl bg-blue-600 p-4 disabled:opacity-50"
                    >
                      <Text className="text-center font-semibold text-white">Send follow-up</Text>
                    </Pressable>
                  </>
                )}
                {draft.status === "review" && draft.draft && (
                  <Pressable
                    disabled={action.isPending}
                    onPress={() =>
                      action.mutate({
                        type: "approve",
                        revision: draft.revision,
                      })
                    }
                    className="rounded-xl bg-green-700 p-4 disabled:opacity-50"
                  >
                    <Text className="text-center font-semibold text-white">
                      Approve revision {draft.revision} and publish
                    </Text>
                  </Pressable>
                )}
                {draft.status === "approved" && (
                  <Text className="text-green-600">Published to the exercise library.</Text>
                )}
                {draft.status !== "approved" && draft.status !== "cancelled" && (
                  <Pressable
                    disabled={action.isPending}
                    onPress={() => action.mutate({ type: "cancel" })}
                    className="p-4"
                  >
                    <Text className="text-center text-red-500">Cancel draft</Text>
                  </Pressable>
                )}
              </>
            )}
            {action.isPending && <ActivityIndicator />}
            {action.error && (
              <Text accessibilityRole="alert" className="text-red-500">
                {action.error.message}. The latest revision has been refreshed; review it before
                trying again.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
