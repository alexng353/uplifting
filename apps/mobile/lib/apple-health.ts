import type { StoredWorkout } from "../services/storage";

export interface HealthWorkout {
  start: Date;
  end: Date;
  metadata: Record<string, string | boolean>;
}

/** What a finished workout becomes in Health, or null when it shouldn't go there. */
export function healthWorkoutFor(workout: StoredWorkout): HealthWorkout | null {
  if ((workout.kind ?? "workout") !== "workout" || !workout.endTime) return null;
  // Both Finish and the auto-cap path can carry empty rows; only sets with reps count.
  const hasWork = workout.exercises.some((exercise) =>
    exercise.sets.some((set) => set.reps != null && set.reps > 0),
  );
  if (!hasWork) return null;
  const start = new Date(workout.startTime);
  const end = new Date(workout.endTime);
  if (!(end.getTime() > start.getTime())) return null;
  return {
    start,
    end,
    // HKMetadataKeyExternalUUID ties the Health entry back to this workout.
    metadata: { HKExternalUUID: workout.id, HKIndoorWorkout: true },
  };
}
