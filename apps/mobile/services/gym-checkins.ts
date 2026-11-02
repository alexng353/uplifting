import { api } from "../lib/api";
import {
  flushCheckins,
  recordCheckin,
  type CheckinDeps,
  type GymCheckin,
} from "../lib/gym-checkins";
import { getFixForCheckin } from "./geolocation";
import { getGymCheckinQueue, setGymCheckinQueue } from "./storage";

const deps: CheckinDeps = {
  load: () => getGymCheckinQueue<GymCheckin>(),
  save: (queue) => setGymCheckinQueue(queue),
  locate: getFixForCheckin,
  send: async (checkin) => {
    const { error } = await api.api.v1.gate.checkins.post(checkin);
    if (!error) return "stored";
    // Eden types only the validation status (422); the route also answers 400 for a bad time.
    const status: number = error.status;
    // Malformed: retrying can't fix it. Anything else (auth, server, network) is retried.
    if (status === 400 || status === 422) return "rejected";
    throw new Error(`check-in failed: ${status}`);
  },
};

/** Records where the phone is now for this workout's Start or Finish. Never throws. */
export function recordGymCheckin(
  clientWorkoutId: string,
  kind: "start" | "finish",
  at: string,
): void {
  recordCheckin(deps, clientWorkoutId, kind, at).catch(() => {});
}

/** Retries queued check-ins (called from the activity heartbeat). Never throws. */
export function flushGymCheckins(): void {
  flushCheckins(deps).catch(() => {});
}
