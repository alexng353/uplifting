import { useEffect, useState } from "react";
import { liveStateFor } from "../lib/live-activity";
import { upliftingLive } from "../modules/uplifting-live";
import { clearRest, getRest, subscribeRest } from "../services/rest-timer";
import type { StoredWorkout } from "../services/storage";
import { usePreviousSets } from "./usePreviousSets";
import { useSettings } from "./useSettings";

/**
 * Keeps the workout Live Activity (Lock Screen + Dynamic Island) in step with the
 * workout: started with the workout, updated on every change, ended at Finish/cancel.
 */
export function useLiveActivity(workout: StoredWorkout | null, activeIndex: number): void {
  const { getSuggestion, getTargetSetCount } = usePreviousSets();
  const { getDisplayUnit } = useSettings();
  const unit = getDisplayUnit();
  const [rest, setRest] = useState(getRest);

  useEffect(() => subscribeRest(setRest), []);

  // When the rest runs out, drop it so the activity goes back to the workout clock.
  useEffect(() => {
    if (!rest) return;
    const timer = setTimeout(clearRest, Math.max(0, rest.endsAt - Date.now()) + 250);
    return () => clearTimeout(timer);
  }, [rest]);

  const workoutId = workout?.id ?? null;
  useEffect(() => {
    const live = upliftingLive();
    if (!live?.isLiveActivitySupported()) return;
    if (!workout) {
      clearRest();
      live.endActivities(null).catch(() => {});
      return;
    }
    const state = liveStateFor(workout, activeIndex, {
      targetSetCount: getTargetSetCount,
      suggestion: (exerciseId, profileId, setNumber) =>
        getSuggestion(exerciseId, profileId, setNumber),
      unit,
      rest,
      now: Date.now(),
    });
    live.startOrUpdateActivity(workout.id, Date.parse(workout.startTime), state).catch(() => {});
  }, [workout, workoutId, activeIndex, rest, unit, getSuggestion, getTargetSetCount]);
}
