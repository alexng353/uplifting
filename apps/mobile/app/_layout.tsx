import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { WorkoutProvider } from "../hooks/useWorkout";
import { useBootstrap } from "../hooks/useBootstrap";
import { ActivityTracker } from "../components/ActivityTracker";
import { getSettings, hydrateStorage } from "../services/storage";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Appearance } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

const queryClient = new QueryClient();

function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    const stored = getSettings().colorScheme;
    if (stored === "system") {
      setColorScheme("system");
    } else {
      setColorScheme(stored);
    }
  }, []);

  return <>{children}</>;
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isBootstrapped, isLoading: isBootstrapping } = useBootstrap();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "login";
    if (!isAuthenticated && !inAuth) router.replace("/login");
    else if (isAuthenticated && inAuth) router.replace("/(tabs)/me");
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated && isBootstrapping && !isBootstrapped) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-900">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500 dark:text-zinc-400">Syncing data...</Text>
      </View>
    );
  }

  return (
    <>
      <ActivityTracker />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    hydrateStorage().then(() => setStorageReady(true));
  }, []);

  if (!storageReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardProvider>
      <QueryClientProvider client={queryClient}>
        <ColorSchemeProvider>
          <AuthProvider>
            <WorkoutProvider>
              <AuthGate />
            </WorkoutProvider>
          </AuthProvider>
        </ColorSchemeProvider>
      </QueryClientProvider>
    </KeyboardProvider>
  );
}
