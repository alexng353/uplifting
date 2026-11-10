import * as Location from "expo-location";
import type { Fix } from "../lib/gym-checkins";
import { api } from "../lib/api";
import { type Coordinates, gymInRange, nearestGym, nextCurrentGym } from "../lib/current-gym";
import {
  getCurrentGymId,
  getCurrentGymManualFor,
  getCurrentWorkout,
  getGyms,
  setCurrentGymDetectedAt,
  setCurrentGymId,
} from "./storage";

/**
 * Get current position only if permission is already granted.
 */
export async function getCurrentPosition(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      return null;
    }
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Request permission and get position. Use for explicit user actions
 * (e.g. setting up a gym) where prompting is expected.
 */
export async function requestAndGetPosition(): Promise<Coordinates | null> {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      const response = await Location.requestForegroundPermissionsAsync();
      if (response.status !== Location.PermissionStatus.GRANTED) {
        return null;
      }
    }
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * One fix with its accuracy for a gym check-in, asking for When-In-Use access
 * if it hasn't been decided yet. Only called for the account the server
 * enrolled, at Start and Finish while the app is open. Waits at most
 * FIX_TIMEOUT_MS, then takes a recent last-known position, else null.
 */
export async function getFixForCheckin(): Promise<Fix | null> {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.UNDETERMINED) {
      status = (await Location.requestForegroundPermissionsAsync()).status;
    }
    if (status !== Location.PermissionStatus.GRANTED) return null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const position = await Promise.race([
      // iOS rejects when no fix is available; fall through to the last-known one.
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), FIX_TIMEOUT_MS);
      }),
    ]).finally(() => clearTimeout(timer));
    const fix =
      position ?? (await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }));
    if (!fix) return null;
    const { latitude, longitude, accuracy } = fix.coords;
    // CoreLocation reports a negative accuracy for an invalid fix.
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (accuracy ?? 0) < 0)
      return null;
    return { latitude, longitude, accuracy: accuracy ?? null };
  } catch {
    return null;
  }
}

const FIX_TIMEOUT_MS = 15_000;
/** Short, so a fix from the drive over or the walk out can't stand in for the tap. */
const LAST_KNOWN_MAX_AGE_MS = 30_000;

/**
 * Switch the current gym to the saved gym the phone is at (within 300 m), at workout
 * Start and when the app comes to the foreground. Never asks for location: without
 * permission or with nothing near, the last gym stays. The pick is saved to the server
 * too, so the next settings sync doesn't bring the old gym back.
 */
export async function detectAndSetNearbyGym(): Promise<string | null> {
  const position = await getCurrentPosition();
  if (!position) return null;
  const gyms = getGyms();
  const current = getCurrentGymId();
  const next = nextCurrentGym({
    detected: nearestGym(position, gyms)?.id ?? null,
    current,
    currentInRange: gymInRange(
      position,
      gyms.find((g) => g.id === current),
    ),
    manualForWorkout: getCurrentGymManualFor(),
    activeWorkoutId: getCurrentWorkout()?.id ?? null,
  });
  if (!next) return null;
  setCurrentGymDetectedAt(Date.now());
  setCurrentGymId(next);
  api.api.v1.users.settings.put({ current_gym_id: next }).catch(() => {});
  return next;
}
