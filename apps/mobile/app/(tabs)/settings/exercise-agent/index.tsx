import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useExerciseAgent } from "../../../../hooks/useExerciseAgent";
import { enableExerciseNotifications } from "../../../../services/exercise-agent-notifications";

export default function ExerciseAgentList() {
  const router = useRouter();
  const { enabled, sessions, action } = useExerciseAgent();
  const [message, setMessage] = useState("");
  const [notificationNote, setNotificationNote] = useState("");
  async function start() {
    // Generation is independent of the OS permission dialog and push service.
    void enableExerciseNotifications()
      .then((ok) => {
        if (!ok)
          setNotificationNote("Notifications unavailable. Your drafts remain available here.");
      })
      .catch(() =>
        setNotificationNote("Notifications unavailable. Your drafts remain available here."),
      );
    try {
      const session = await action.mutateAsync({
        type: "start",
        message: message.trim(),
      });
      setMessage("");
      router.push({
        pathname: "/(tabs)/settings/exercise-agent/[id]",
        params: { id: session.id },
      });
    } catch {}
  }
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-zinc-900" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text className="text-blue-500">Back</Text>
        </Pressable>
        <Text className="text-2xl font-bold dark:text-zinc-100">Exercise drafts</Text>
        {!enabled ? (
          <Text className="dark:text-zinc-100">Administrator access required.</Text>
        ) : (
          <>
            <Text className="text-gray-500 dark:text-zinc-400">
              Enter an exercise name and any instructions. Generation continues when you leave.
              Nothing is published until you approve a revision.
            </Text>
            <TextInput
              accessibilityLabel="Exercise name and instructions"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={4000}
              placeholder="e.g. Incline dumbbell press"
              placeholderTextColor="#71717a"
              className="rounded-xl border border-gray-300 dark:border-zinc-600 p-4 dark:text-zinc-100"
            />
            <Pressable
              accessibilityRole="button"
              disabled={!message.trim() || action.isPending}
              onPress={start}
              className="rounded-xl bg-blue-600 p-4 disabled:opacity-50"
            >
              <Text className="text-center font-semibold text-white">
                {action.isPending ? "Starting…" : "Generate draft"}
              </Text>
            </Pressable>
            {!!notificationNote && (
              <Text className="text-gray-500 dark:text-zinc-400">{notificationNote}</Text>
            )}
            {action.error && (
              <Text accessibilityRole="alert" className="text-red-500">
                {action.error.message}
              </Text>
            )}
            {sessions.isLoading && <ActivityIndicator />}
            {sessions.error && (
              <Pressable onPress={() => sessions.refetch()}>
                <Text className="text-red-500">Could not load drafts. Tap to retry.</Text>
              </Pressable>
            )}
            {sessions.data?.length === 0 && <Text className="text-gray-500">No drafts yet.</Text>}
            {sessions.data?.map((session) => (
              <Pressable
                key={session.id}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/settings/exercise-agent/[id]",
                    params: { id: session.id },
                  })
                }
                className="rounded-xl bg-white dark:bg-zinc-800 p-4"
              >
                <Text className="font-semibold dark:text-zinc-100">
                  {session.draft?.name ?? session.messages[0]?.content ?? "Exercise draft"}
                </Text>
                <Text className="mt-1 text-gray-500 dark:text-zinc-400">
                  {session.status.replaceAll("_", " ")} · Revision {session.revision}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
