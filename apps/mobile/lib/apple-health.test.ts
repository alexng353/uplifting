import { expect, test } from "bun:test";
import type { StoredWorkout } from "../services/storage";
import { healthWorkoutFor } from "./apple-health";

const base: StoredWorkout = {
  id: "w1",
  startTime: "2026-11-02T18:00:00Z",
  endTime: "2026-11-02T19:02:00Z",
  privacy: "friends",
  kind: "workout",
  exercises: [
    {
      exerciseId: "bench",
      exerciseName: "Bench",
      sets: [{ id: "s", reps: 5, weight: 100, weightUnit: "kg", createdAt: "2026-11-02" }],
    },
  ],
};

test("a finished workout keeps its times and its id", () => {
  expect(healthWorkoutFor(base)).toEqual({
    start: new Date("2026-11-02T18:00:00Z"),
    end: new Date("2026-11-02T19:02:00Z"),
    metadata: { HKExternalUUID: "w1", HKIndoorWorkout: true },
  });
});

test("rest days, unfinished, empty and zero-length workouts stay out of Health", () => {
  expect(healthWorkoutFor({ ...base, kind: "rest" })).toBeNull();
  expect(healthWorkoutFor({ ...base, endTime: undefined })).toBeNull();
  expect(healthWorkoutFor({ ...base, exercises: [] })).toBeNull();
  expect(healthWorkoutFor({ ...base, exercises: [{ ...base.exercises[0], sets: [] }] })).toBeNull();
  expect(
    healthWorkoutFor({
      ...base,
      exercises: [
        { ...base.exercises[0], sets: [{ id: "e", weightUnit: "kg", createdAt: "2026-11-02" }] },
      ],
    }),
  ).toBeNull();
  expect(healthWorkoutFor({ ...base, endTime: base.startTime })).toBeNull();
});
