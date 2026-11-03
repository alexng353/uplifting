import { expect, test } from "bun:test";
import type { StoredSet } from "../services/storage";
import { summarizeWorkout } from "./workout-summary";

let n = 0;
const set = (reps?: number, weight?: number, side?: "L" | "R", layout?: "combined"): StoredSet => ({
  id: `s${++n}`,
  reps,
  weight,
  side,
  layout,
  weightUnit: "lbs",
  createdAt: "2026-11-03",
});
const fmt = (s: StoredSet) => `${s.reps}x${s.weight ?? 0} lbs`;

test("leaves empty rows and empty exercises out of counts and labels", () => {
  const stats = summarizeWorkout(
    [
      {
        exerciseId: "split-squat",
        exerciseName: "Split Squat",
        sets: [
          set(10, 20, "R"),
          set(10, 20, "L"),
          set(5, 20, "R"),
          set(10, 20, "L"),
          set(undefined, undefined, "R"),
          set(undefined, undefined, "L"),
          set(0, 0, "R"),
          set(0, 0, "L"),
        ],
      },
      { exerciseId: "curl", exerciseName: "Curl", sets: [set(8, 30), set(), set(0, 30)] },
      { exerciseId: "empty", exerciseName: "Never logged", sets: [set()] },
    ],
    fmt,
  );
  expect(stats.exercises.map((e) => [e.exerciseName, e.setCount, e.labels])).toEqual([
    ["Split Squat", 2, ["10x20 lbs L/R", "R 5x20 lbs · L 10x20 lbs"]],
    ["Curl", 1, ["8x30 lbs"]],
  ]);
  expect(stats.totalSets).toBe(3);
  expect(stats.totalReps).toBe(10 + 10 + 5 + 10 + 8);
  expect(stats.totalVolume).toBe(35 * 20 + 8 * 30);
});

test("a unilateral row is one set and counts both sides' volume", () => {
  const stats = summarizeWorkout(
    [
      {
        exerciseId: "x",
        exerciseName: "Leg Curl",
        sets: [set(6, 50), set(6, 50, "R", "combined"), set(6, 50, "L", "combined")],
      },
    ],
    fmt,
  );
  expect(stats.exercises[0].labels).toEqual(["6x50 lbs", "6x50 lbs L/R"]);
  expect(stats.totalSets).toBe(2);
  expect(stats.totalVolume).toBe(3 * 300);
});
