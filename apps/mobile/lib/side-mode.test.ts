import { expect, mock, test } from "bun:test";

// Same native stand-ins as hooks/useWorkout.test.tsx; storage itself stays real.
mock.module("@react-native-async-storage/async-storage", () => ({
  default: { setItem: async () => {}, removeItem: async () => {} },
}));
mock.module("expo-crypto", () => ({ randomUUID: () => crypto.randomUUID() }));

const { setSideModeMutation } = await import("./workout-mutations");
const { sideModeOf } = await import("./side-mode");
const { setFieldOrder } = await import("./set-field-order");
import type { StoredWorkout } from "../services/storage";

const workout = (exercise: StoredWorkout["exercises"][number]): StoredWorkout => ({
  id: "w",
  startTime: "2026-11-03T17:00:00Z",
  privacy: "friends",
  kind: "workout",
  exercises: [exercise],
});
const set = (id: string, side?: "L" | "R", reps?: number) => ({
  id,
  side,
  reps,
  weightUnit: "kg",
  createdAt: "2026-11-03",
});

test("exercises saved before the control read as split", () => {
  expect(sideModeOf({ isUnilateral: true })).toBe("split");
  expect(sideModeOf({ isUnilateral: true, sideLayout: "combined" })).toBe("unilateral");
  expect(sideModeOf({})).toBe("bilateral");
});

test("bilateral to unilateral makes an L and R set per row", () => {
  const out = setSideModeMutation(
    workout({ exerciseId: "e", exerciseName: "E", sets: [set("a", undefined, 8)] }),
    "e",
    "unilateral",
  ).exercises[0];
  expect(sideModeOf(out)).toBe("unilateral");
  expect(out.sets.map((s) => [s.side, s.reps])).toEqual([
    ["R", 8],
    ["L", 8],
  ]);
});

test("unilateral and split swap layout only, and bilateral drops the layout", () => {
  const sided = {
    exerciseId: "e",
    exerciseName: "E",
    isUnilateral: true,
    sets: [set("r", "R", 6), set("l", "L", 5)],
  };
  const combined = setSideModeMutation(workout(sided), "e", "unilateral").exercises[0];
  expect(combined.sets).toEqual(sided.sets);
  expect(sideModeOf(combined)).toBe("unilateral");
  const split = setSideModeMutation(workout(combined), "e", "split").exercises[0];
  expect(split.sets).toEqual(sided.sets);
  expect(sideModeOf(split)).toBe("split");
  const bilateral = setSideModeMutation(workout(combined), "e", "bilateral").exercises[0];
  expect(bilateral.sideLayout).toBeUndefined();
  expect(bilateral.sets.map((s) => [s.side, s.reps])).toEqual([[undefined, 6]]);
});

test("Next walks a combined row L then R, a split pair R row then L row", () => {
  const sets = [set("r1", "R"), set("l1", "L")];
  const keys = (sideLayout?: "combined" | "split") =>
    setFieldOrder([
      { exerciseId: "e", exerciseName: "E", isUnilateral: true, sideLayout, sets },
    ]).map((s) => s.key);
  expect(keys("combined")).toEqual(["l1:reps", "l1:weight", "r1:reps", "r1:weight"]);
  expect(keys(undefined)).toEqual(["r1:reps", "r1:weight", "l1:reps", "l1:weight"]);
});
