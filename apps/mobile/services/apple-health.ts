import { Platform } from "react-native";
import { healthWorkoutFor } from "../lib/apple-health";
import type { StoredWorkout } from "./storage";

// Loaded on demand so Android, web and bun tests never touch the native module.
const loadHealthKit = () => import("@kingstinct/react-native-healthkit");

const WORKOUT_TYPE = "HKWorkoutTypeIdentifier" as const;

/**
 * Asks once for permission to save workouts. Reading Health workouts later (e.g. walks
 * for the gym gate) only needs `toRead` added here; iOS then asks for just the new type.
 * Returns whether saving is allowed.
 */
export async function connectAppleHealth(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  const healthKit = await loadHealthKit();
  if (!(await healthKit.isHealthDataAvailableAsync())) return false;
  await healthKit.requestAuthorization({ toShare: [WORKOUT_TYPE] });
  return (
    healthKit.authorizationStatusFor(WORKOUT_TYPE) ===
    healthKit.AuthorizationStatus.sharingAuthorized
  );
}

export async function saveWorkoutToAppleHealth(workout: StoredWorkout): Promise<void> {
  if (Platform.OS !== "ios") return;
  const entry = healthWorkoutFor(workout);
  if (!entry) return;
  const healthKit = await loadHealthKit();
  // Permission can be revoked in the Health app at any time; skip quietly then.
  if (
    healthKit.authorizationStatusFor(WORKOUT_TYPE) !==
    healthKit.AuthorizationStatus.sharingAuthorized
  ) {
    return;
  }
  await healthKit.saveWorkoutSample(
    healthKit.WorkoutActivityType.traditionalStrengthTraining,
    [],
    entry.start,
    entry.end,
    undefined,
    entry.metadata,
  );
}
