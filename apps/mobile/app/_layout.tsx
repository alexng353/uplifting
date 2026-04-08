import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { WorkoutProvider } from "../hooks/useWorkout";
import { useBootstrap } from "../hooks/useBootstrap";
import { ActivityTracker } from "../components/ActivityTracker";
import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";

const queryClient = new QueryClient();

function BootstrapGate() {
  const { isAuthenticated } = useAuth();
  const { isBootstrapped, isLoading } = useBootstrap();

  // Only show loading when authenticated and still bootstrapping
  if (isAuthenticated && isLoading && !isBootstrapped) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Syncing data...</Text>
      </View>
    );
  }

  return <Slot />;
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <>
      <ActivityTracker />
      <BootstrapGate />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkoutProvider>
          <AuthGate />
        </WorkoutProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
