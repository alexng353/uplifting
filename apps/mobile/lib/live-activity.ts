import type { StoredSet, StoredWorkout, StoredWorkoutExercise } from "../services/storage";
import type { SetSuggestion } from "./previous-sets";
import { rowSets, toRows } from "./set-rows";
import { convertWeight } from "./units";

/** What the Live Activity shows. Mirrors UpliftingWorkoutAttributes.ContentState. */
export interface LiveWorkoutState {
  exercise: string;
  setLabel: string;
  detail: string;
  restStartedAt?: number;
  restEndsAt?: number;
}

export interface RestWindow {
  startedAt: number;
  endsAt: number;
}

export interface LiveStateDeps {
  targetSetCount: (exerciseId: string, profileId?: string) => number | null;
  suggestion: (
    exerciseId: string,
    profileId: string | undefined,
    setNumber: number,
  ) => SetSuggestion;
  unit: string;
  rest: RestWindow | null;
  now: number;
}

/** A set counts as done once both fields hold a value, the same as the green check. */
export function isSetDone(set: StoredSet): boolean {
  return set.reps != null && set.weight != null;
}

const lift = (reps: number, weight: number, unit: string) =>
  `${reps}×${Math.round(weight * 10) / 10} ${unit}`;

function rowLift(sets: StoredSet[], unit: string): string | null {
  const done = sets.filter(isSetDone);
  if (done.length === 0) return null;
  const labels = done.map((s) => lift(s.reps!, convertWeight(s.weight!, s.weightUnit, unit), unit));
  // An L/R pair with equal sides reads as one lift.
  return labels.every((l) => l === labels[0]) ? labels[0] : labels.join(" / ");
}

/**
 * The exercise to show: the one on screen, or the last one with sets when the
 * Add Exercise page is showing.
 */
function exerciseFor(workout: StoredWorkout, index: number): StoredWorkoutExercise | undefined {
  const onScreen = workout.exercises[index];
  if (onScreen) return onScreen;
  return workout.exercises.at(-1);
}

export function liveStateFor(
  workout: StoredWorkout,
  activeIndex: number,
  deps: LiveStateDeps,
): LiveWorkoutState {
  const rest =
    deps.rest && deps.rest.endsAt > deps.now
      ? { restStartedAt: deps.rest.startedAt, restEndsAt: deps.rest.endsAt }
      : {};
  const exercise = exerciseFor(workout, activeIndex);
  if (!exercise) {
    return { exercise: "Workout", setLabel: "Add an exercise", detail: "", ...rest };
  }

  const rows = toRows(exercise.sets);
  const doneRows = rows.filter((row) => rowSets(row).every(isSetDone));
  const nextIndex = rows.findIndex((row) => !rowSets(row).every(isSetDone));
  // Every row done: the next set would be a new one.
  const setNumber = (nextIndex === -1 ? rows.length : nextIndex) + 1;
  const target = deps.targetSetCount(exercise.exerciseId, exercise.profileId);
  const allDone = target != null && doneRows.length >= target && nextIndex === -1;
  const setLabel = allDone
    ? `${doneRows.length}/${target} sets done`
    : target != null
      ? `Set ${setNumber}/${target}`
      : `Set ${setNumber}`;

  const parts: string[] = [];
  const lastRow = doneRows.at(-1);
  const last = lastRow ? rowLift(rowSets(lastRow), deps.unit) : null;
  if (last) parts.push(`Last ${last}`);
  if (!allDone) {
    const s = deps.suggestion(exercise.exerciseId, exercise.profileId, setNumber);
    if (s.reps != null) {
      const w = convertWeight(s.weight ?? 0, s.weightUnit ?? deps.unit, deps.unit);
      parts.push(`Target ${lift(s.reps, w, deps.unit)}`);
    }
  }

  return { exercise: exercise.exerciseName, setLabel, detail: parts.join(" · "), ...rest };
}
