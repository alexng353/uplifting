/**
 * Which saved gym the phone is at. Pure, so the rule is testable without location
 * services: the nearest saved gym with coordinates within the radius, else none (the
 * caller keeps the last gym).
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GymPoint {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
}

/** Saved gyms count as "here" within this distance. */
export const GYM_PROXIMITY_THRESHOLD_METERS = 300;

export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestGym(
  position: Coordinates,
  gyms: readonly GymPoint[],
  radius = GYM_PROXIMITY_THRESHOLD_METERS,
): { id: string; distance: number } | null {
  let best: { id: string; distance: number } | null = null;
  for (const gym of gyms) {
    if (gym.latitude == null || gym.longitude == null) continue;
    const distance = haversineDistance(position, {
      latitude: gym.latitude,
      longitude: gym.longitude,
    });
    if (distance <= radius && (!best || distance < best.distance)) best = { id: gym.id, distance };
  }
  return best;
}

/**
 * The gym to switch to, or null to keep the current one. A gym the phone is at wins over
 * the last one used (Alex had to swap SFU Rec for Gold's by hand), except while a gym
 * picked by hand during this workout stands. With location off or no saved gym nearby,
 * the last gym stays.
 */
export function nextCurrentGym(args: {
  detected: string | null;
  current: string | null;
  /** The workout during which the current gym was picked by hand, if any. */
  manualForWorkout: string | null;
  activeWorkoutId: string | null;
}): string | null {
  const { detected, current, manualForWorkout, activeWorkoutId } = args;
  if (manualForWorkout != null && manualForWorkout === activeWorkoutId) return null;
  if (!detected || detected === current) return null;
  return detected;
}

/** A fresh detection beats a settings response fetched before it was saved. */
export const DETECTION_HOLD_MS = 2 * 60_000;

export function serverGymApplies(args: {
  serverGymId: string | null;
  localGymId: string | null;
  detectedAt: number | null;
  now: number;
}): boolean {
  const { serverGymId, localGymId, detectedAt, now } = args;
  if (serverGymId === localGymId) return true;
  return detectedAt == null || now - detectedAt > DETECTION_HOLD_MS;
}
