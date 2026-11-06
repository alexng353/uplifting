import { healthWorkoutFor } from "../lib/apple-health";
import { upliftingLive } from "../modules/uplifting-live";
import { connectAppleHealth, saveWorkoutToAppleHealth } from "./apple-health";
import {
  getHealthPrompted,
  getSettings,
  setHealthPrompted,
  setHealthStats,
  setSettings,
  type StoredWorkout,
} from "./storage";

// Every Health call runs after the previous one, so a Cancel or Finish never overtakes
// a Start that is still waiting on the permission sheet or on HealthKit.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(op: () => Promise<T>): Promise<T> {
  const run = queue.then(op, op);
  queue = run.catch(() => {});
  return run;
}

/**
 * Health is on by default: the first Start asks for permission once (iOS shows its sheet)
 * and turns the Settings switch on if granted. Then, on iOS 26+, a live HealthKit
 * strength session runs for the whole workout so it shows in Fitness while it runs.
 */
export function beginHealthForWorkout(workout: StoredWorkout): Promise<void> {
  return serial(() => begin(workout));
}

async function begin(workout: StoredWorkout): Promise<void> {
  // connectAppleHealth answers "unavailable" off iOS, so Android never sees a prompt.
  if (!getSettings().appleHealth && !getHealthPrompted()) {
    setHealthPrompted();
    const result = await connectAppleHealth().catch(() => "error" as const);
    if (result === "granted") setSettings({ ...getSettings(), appleHealth: true });
    else if (result === "unavailable") return;
  }
  await resume(workout);
}

/** Starts the live session, or picks up the one a killed app left running. */
export function resumeHealthForWorkout(workout: StoredWorkout): Promise<void> {
  return serial(() => resume(workout));
}

async function resume(workout: StoredWorkout): Promise<void> {
  if (!getSettings().appleHealth) return;
  const live = upliftingLive();
  if (!live?.isWorkoutSessionSupported()) return;
  await live.startWorkoutSession(workout.id, Date.parse(workout.startTime)).catch(() => false);
}

/**
 * Finish: the live session saves the Health workout itself (with energy and heart rate),
 * which are kept on the phone for this workout. Without a live session (iOS < 26, or it
 * failed) the plain PR 23 entry is saved instead, so Health never gets two.
 */
export function finishHealthForWorkout(workout: StoredWorkout): Promise<void> {
  return serial(() => finish(workout));
}

async function finish(workout: StoredWorkout): Promise<void> {
  const live = upliftingLive();
  if (!getSettings().appleHealth || !healthWorkoutFor(workout)) {
    await live?.discardWorkoutSession().catch(() => {});
    return;
  }
  const result = live
    ? await live
        .finishWorkoutSession(workout.id, Date.parse(workout.endTime ?? new Date().toISOString()))
        .catch(() => null)
    : null;
  if (result?.saved) {
    setHealthStats(workout.id, {
      activeKcal: result.activeKcal,
      avgHeartRate: result.avgHeartRate,
      maxHeartRate: result.maxHeartRate,
      healthWorkoutId: result.healthWorkoutId,
    });
    return;
  }
  // No live session to save: drop any partial entry HealthKit saved on its own first.
  await live?.deleteSavedWorkouts(workout.id).catch(() => {});
  await saveWorkoutToAppleHealth(workout);
}

/** Cancel: nothing goes to Health. */
export function discardHealthForWorkout(): Promise<void> {
  return serial(async () => {
    await upliftingLive()
      ?.discardWorkoutSession()
      .catch(() => {});
  });
}
