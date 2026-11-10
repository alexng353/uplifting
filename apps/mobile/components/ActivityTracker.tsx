import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useWorkout } from "../hooks/useWorkout";
import { api } from "../lib/api";
import { detectAndSetNearbyGym } from "../services/geolocation";
import { flushGymCheckins } from "../services/gym-checkins";

const HEARTBEAT_INTERVAL = 60_000; // 60 seconds

/**
 * Sends periodic heartbeats to update user activity status.
 * Must be rendered inside both AuthProvider and WorkoutProvider.
 * Renders nothing.
 */
export function ActivityTracker() {
  const { isAuthenticated } = useAuth();
  const { workout } = useWorkout();
  const workoutIdRef = useRef<string | null>(null);

  // Keep ref in sync so interval closure always sees latest value
  useEffect(() => {
    workoutIdRef.current = workout?.id ?? null;
  }, [workout?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const sendHeartbeat = async () => {
      // Gym check-ins that couldn't be sent at the gym go out on the next beat.
      flushGymCheckins();
      try {
        await api.api.v1.friends.activity.post({
          current_workout_id: workoutIdRef.current ?? undefined,
        });
      } catch {
        // Silently ignore — heartbeat failures are not critical
      }
    };

    // Send immediately on mount
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Coming back to the app at a gym switches the current gym to it (launch and Start
  // already do), at most once a minute.
  useEffect(() => {
    if (!isAuthenticated) return;
    let last = 0;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || Date.now() - last < 60_000) return;
      last = Date.now();
      detectAndSetNearbyGym().catch(() => {});
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  return null;
}
