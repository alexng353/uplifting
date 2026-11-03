import { expect, test } from "bun:test";
import type { StoredSet, StoredWorkoutExercise } from "../services/storage";
import { neighbourStop, setFieldOrder } from "./set-field-order";

const set = (id: string, side?: "L" | "R"): StoredSet => ({
  id,
  side,
  weightUnit: "kg",
  createdAt: "2026-11-02",
});

const exercises: StoredWorkoutExercise[] = [
  { exerciseId: "bench", exerciseName: "Bench", sets: [set("a"), set("b")] },
  {
    exerciseId: "row",
    exerciseName: "Row",
    isUnilateral: true,
    sets: [set("r1", "R"), set("r2", "R"), set("l1", "L"), set("l2", "L")],
  },
];

test("walks reps then weight, row by row, pairs R then L, across exercises", () => {
  expect(setFieldOrder(exercises).map((s) => `${s.exerciseIndex}/${s.key}`)).toEqual([
    "0/a:reps",
    "0/a:weight",
    "0/b:reps",
    "0/b:weight",
    "1/r1:reps",
    "1/r1:weight",
    "1/l1:reps",
    "1/l1:weight",
    "1/r2:reps",
    "1/r2:weight",
    "1/l2:reps",
    "1/l2:weight",
  ]);
});

test("the ends have no neighbour, and an unknown field has none", () => {
  const stops = setFieldOrder(exercises);
  expect(neighbourStop(stops, "a:reps", -1)).toBeNull();
  expect(neighbourStop(stops, "l2:weight", 1)).toBeNull();
  expect(neighbourStop(stops, "b:weight", 1)).toEqual({ key: "r1:reps", exerciseIndex: 1 });
  expect(neighbourStop(stops, "r1:reps", -1)).toEqual({ key: "b:weight", exerciseIndex: 0 });
  expect(neighbourStop(stops, "gone:reps", 1)).toBeNull();
  expect(neighbourStop(stops, null, 1)).toBeNull();
});

test("a mixed exercise walks bilateral rows, then a unilateral row as one reps/weight", () => {
  const mixed: StoredWorkoutExercise = {
    exerciseId: "curl",
    exerciseName: "Curl",
    isUnilateral: true,
    sets: [
      set("b1"),
      { ...set("r1", "R"), layout: "combined" },
      { ...set("l1", "L"), layout: "combined" },
    ],
  };
  expect(setFieldOrder([mixed]).map((s) => s.key)).toEqual([
    "b1:reps",
    "b1:weight",
    "r1:reps",
    "r1:weight",
  ]);
});
