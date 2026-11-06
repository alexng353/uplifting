import type { RestWindow } from "../lib/live-activity";

/**
 * The automatic rest timer: starts when a set is done (accept check, or both fields
 * filled), counts down from the default rest time in Settings. Shared by the workout
 * screen and the Live Activity.
 */
let current: RestWindow | null = null;
const listeners = new Set<(rest: RestWindow | null) => void>();

export function getRest(): RestWindow | null {
  return current;
}

export function startRest(seconds: number, now = Date.now()): void {
  if (!(seconds > 0)) return;
  current = { startedAt: now, endsAt: now + seconds * 1000 };
  listeners.forEach((l) => l(current));
}

export function clearRest(): void {
  if (current === null) return;
  current = null;
  listeners.forEach((l) => l(null));
}

export function subscribeRest(listener: (rest: RestWindow | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
