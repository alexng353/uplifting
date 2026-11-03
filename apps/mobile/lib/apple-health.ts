import type { StoredWorkout } from "../services/storage";

export interface HealthWorkout {
  start: Date;
  end: Date;
  metadata: Record<string, string | boolean>;
}

/** What a finished workout becomes in Health, or null when it shouldn't go there. */
export function healthWorkoutFor(workout: StoredWorkout): HealthWorkout | null {
  if ((workout.kind ?? "workout") !== "workout" || !workout.endTime) return null;
  if (!workout.exercises.some((exercise) => exercise.sets.length > 0)) return null;
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
