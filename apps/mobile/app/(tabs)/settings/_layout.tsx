import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="exercise-profiles" />
      <Stack.Screen name="rep-ranges" />
    </Stack>
  );
}
