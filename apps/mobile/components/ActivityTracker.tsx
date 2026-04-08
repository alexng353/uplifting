import { useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useWorkout } from "../hooks/useWorkout";
import { api } from "../lib/api";

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

  return null;
}
