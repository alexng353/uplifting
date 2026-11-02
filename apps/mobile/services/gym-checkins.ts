import { api } from "../lib/api";
import {
  flushCheckins,
  outcomeForStatus,
  recordCheckin,
  type CheckinDeps,
  type GymCheckin,
} from "../lib/gym-checkins";
import { getFixForCheckin } from "./geolocation";
import { getGymCheckinQueue, getGymCheckinUser, setGymCheckinQueue } from "./storage";

const deps: CheckinDeps = {
  load: getGymCheckinQueue,
  save: setGymCheckinQueue,
  enrolledUser: getGymCheckinUser,
  locate: getFixForCheckin,
  send: async (checkin) => {
    const { error } = await api.api.v1.gate.checkins.post(checkin);
    // Eden types only the validation status (422); the route also answers 400 for a bad time.
    return outcomeForStatus(error ? (error.status as number) : null);
  },
  now: Date.now,
};

/** Records where the phone is now for this workout's Start or Finish (enrolled account only). Never throws. */
export function recordGymCheckin(
  clientWorkoutId: string,
  kind: GymCheckin["kind"],
  at: string,
): void {
  recordCheckin(deps, clientWorkoutId, kind, at).catch(() => {});
}

/** Retries queued check-ins (called from the activity heartbeat). Never throws. */
export function flushGymCheckins(): void {
  flushCheckins(deps).catch(() => {});
}
