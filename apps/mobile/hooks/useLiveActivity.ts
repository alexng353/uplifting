import { useEffect, useState } from "react";
import { liveStateFor } from "../lib/live-activity";
import { getActiveSlide, subscribeActiveSlide } from "../lib/active-slide";
import { upliftingLive } from "../modules/uplifting-live";
import { clearRest, getRest, subscribeRest } from "../services/rest-timer";
import { usePreviousSets } from "./usePreviousSets";
import { useSettings } from "./useSettings";
import { supersetGroups, useWorkout } from "./useWorkout";
import { inferDayTitle } from "../lib/day-types";
import { getExercises, type StoredWorkout } from "../services/storage";

/** "Leg day" or "Upper" from what has been logged, when no day was picked at Start. */
function inferredTitle(workout: StoredWorkout): string | null {
  const logged = workout.exercises
    .filter((e) => e.sets.some((s) => s.reps != null && s.reps > 0))
    .map((e) => e.exerciseId);
  const byId = new Map(getExercises().map((e) => [e.id, e.primaryMuscles]));
  return inferDayTitle(logged, (id) => byId.get(id) ?? []);
}

/**
 * Keeps the workout Live Activity (Lock Screen + Dynamic Island) in step with the
 * workout: started with the workout, updated on every change, ended at Finish/cancel.
 * Mounted once in the tab layout.
 */
export function useLiveActivity(): void {
  const { workout } = useWorkout();
  const [activeIndex, setActiveIndex] = useState(getActiveSlide);
  useEffect(() => subscribeActiveSlide(setActiveIndex), []);
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
      title: workout.dayTypeName ?? inferredTitle(workout) ?? undefined,
      supersets: supersetGroups(workout),
    });
    live.startOrUpdateActivity(workout.id, Date.parse(workout.startTime), state).catch(() => {});
  }, [workout, workoutId, activeIndex, rest, unit, getSuggestion, getTargetSetCount]);
}
