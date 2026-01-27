import { useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useWorkout } from "../hooks/useWorkout";
import { api } from "../lib/api";

const HEARTBEAT_INTERVAL = 60_000; // 60 seconds

/**
 * Component that sends periodic heartbeats to update user activity status.
 * Must be rendered inside WorkoutProvider.
 */
export function ActivityTracker() {
	const { isAuthenticated } = useAuth();
	const { workout, isActive } = useWorkout();
	const intervalRef = useRef<number | null>(null);

	useEffect(() => {
		if (!isAuthenticated) return;

		const sendHeartbeat = async () => {
			try {
				await api.updateActivity({
					body: {
						current_workout_id: isActive && workout ? workout.id : undefined,
					},
				});
			} catch {
				// Silently fail - activity tracking is not critical
			}
		};

		// Send initial heartbeat
		sendHeartbeat();

		// Set up interval
		intervalRef.current = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isAuthenticated, isActive, workout]);

	return null;
}
