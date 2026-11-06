import { Platform } from "react-native";
import { healthWorkoutFor } from "../lib/apple-health";
import type { StoredWorkout } from "./storage";

// Loaded on demand so Android, web and bun tests never touch the native module.
const loadHealthKit = () => import("@kingstinct/react-native-healthkit");

const WORKOUT_TYPE = "HKWorkoutTypeIdentifier" as const;
const ACTIVE_ENERGY = "HKQuantityTypeIdentifierActiveEnergyBurned" as const;
const HEART_RATE = "HKQuantityTypeIdentifierHeartRate" as const;

export type HealthConnection = "granted" | "denied" | "unavailable";

/**
 * Asks once for permission to save workouts (with their active energy) and to read heart
 * rate and energy back for the live session. Reading more later (e.g. walks for the gym
 * gate) only needs a type added to `toRead`; iOS then asks for just the new type.
 */
export async function connectAppleHealth(): Promise<HealthConnection> {
  if (Platform.OS !== "ios") return "unavailable";
  const healthKit = await loadHealthKit();
  if (!(await healthKit.isHealthDataAvailableAsync())) return "unavailable";
  await healthKit.requestAuthorization({
    toShare: [WORKOUT_TYPE, ACTIVE_ENERGY],
    toRead: [WORKOUT_TYPE, ACTIVE_ENERGY, HEART_RATE],
  });
  // requestAuthorization resolves even when the user declines, so read the status.
  return healthKit.authorizationStatusFor(WORKOUT_TYPE) ===
    healthKit.AuthorizationStatus.sharingAuthorized
    ? "granted"
    : "denied";
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
