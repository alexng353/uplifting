import { expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import type { StoredSet, StoredWorkout } from "../services/storage";
import { liveStateFor } from "./live-activity";

let n = 0;
const set = (reps?: number, weight?: number, side?: "L" | "R", layout?: "combined"): StoredSet => ({
  id: `s${++n}`,
  reps,
  weight,
  side,
  layout,
  weightUnit: "lbs",
  createdAt: "2026-11-05",
});

const workout = (sets: StoredSet[]): StoredWorkout => ({
  id: "w1",
  startTime: "2026-11-05T19:00:00Z",
  privacy: "friends",
  kind: "workout",
  exercises: [{ exerciseId: "bench", exerciseName: "Bench Press", sets }],
});

const deps = (
  target: number | null,
  rest: { startedAt: number; endsAt: number } | null = null,
) => ({
  targetSetCount: () => target,
  suggestion: (_e: string, _p: string | undefined, setNumber: number) =>
    setNumber <= 4
      ? { reps: 6, weight: 220, weightUnit: "lbs" }
      : { reps: null, weight: null, weightUnit: null },
  unit: "lbs",
  rest,
  now: 1000,
});

test("shows the next set against the usual count, with last and target lifts", () => {
  const w = workout([set(6, 215), set(6, 220), set(), set()]);
  expect(liveStateFor(w, 0, deps(4))).toEqual({
    exercise: "Bench Press",
    setLabel: "Set 3/4",
    detail: "Last 6×220 lbs · Target 6×220 lbs",
  });
  expect(liveStateFor(w, 0, deps(null)).setLabel).toBe("Set 3");
});

test("says when the usual set count is done", () => {
  const w = workout([set(6, 215), set(6, 220)]);
  expect(liveStateFor(w, 0, deps(2))).toMatchObject({
    setLabel: "2/2 sets done",
    detail: "Last 6×220 lbs",
  });
});

test("an L/R pair is one set; a running rest timer is passed through", () => {
  const w = workout([
    set(10, 30, "R", "combined"),
    set(10, 30, "L", "combined"),
    set(8, 30, "R"),
    set(undefined, undefined, "L"),
  ]);
  const state = liveStateFor(w, 0, deps(3, { startedAt: 500, endsAt: 2000 }));
  expect(state).toMatchObject({ setLabel: "Set 2/3", restStartedAt: 500, restEndsAt: 2000 });
  expect(state.detail.startsWith("Last 10×30 lbs ·")).toBe(true);
  // An expired rest is not shown.
  expect(liveStateFor(w, 0, deps(3, { startedAt: 0, endsAt: 900 })).restEndsAt).toBeUndefined();
});

test("the Add Exercise page shows the last exercise; an empty workout says so", () => {
  expect(liveStateFor(workout([set(5, 100)]), 1, deps(null)).exercise).toBe("Bench Press");
  expect(liveStateFor({ ...workout([]), exercises: [] }, 0, deps(null)).setLabel).toBe(
    "Add an exercise",
  );
});

test("the widget's copy of the activity attributes matches the app's", () => {
  const root = join(import.meta.dir, "..");
  const block = (p: string) => {
    const src = readFileSync(join(root, p), "utf8");
    return src.slice(
      src.indexOf("// SHARED-ATTRIBUTES-BEGIN"),
      src.indexOf("// SHARED-ATTRIBUTES-END"),
    );
  };
  const app = block("modules/uplifting-live/ios/UpliftingWorkoutAttributes.swift");
  expect(app.length).toBeGreaterThan(100);
  expect(block("targets/workout-widget/UpliftingWorkoutAttributes.swift")).toBe(app);
});

test("superset: points at the next exercise, shows both, and carries the day title", async () => {
  const { liveStateFor } = await import("./live-activity");
  const set = (id: string, reps?: number, weight?: number) => ({
    id,
    reps,
    weight,
    weightUnit: "lbs",
    createdAt: "2026-11-06T22:00:00Z",
  });
  const workout = {
    id: "w",
    startTime: "2026-11-06T22:00:00Z",
    privacy: "friends",
    kind: "workout" as const,
    exercises: [
      {
        exerciseId: "tib",
        exerciseName: "Tibialis Raise",
        sets: [set("a", 25, 0), set("b", 25, 0), set("c")],
      },
      { exerciseId: "lunge", exerciseName: "Reverse Lunge", sets: [set("d", 10, 20), set("e")] },
    ],
  };
  const state = liveStateFor(workout, 0, {
    targetSetCount: () => 3,
    suggestion: () => ({ reps: null, weight: null, weightUnit: null }),
    unit: "lbs",
    rest: null,
    now: 0,
    title: "Lower",
    supersets: [["tib", "lunge"]],
  });
  expect(state.exercise).toBe("Reverse Lunge");
  expect(state.setLabel).toBe("Next · Set 2/3");
  expect(state.superset).toBe("Tibialis Raise 2/3 · Reverse Lunge 1/3");
  expect(state.title).toBe("Lower");
  // Bodyweight reads as reps, not 25×0.
  const tib = liveStateFor(workout, 0, {
    targetSetCount: () => 3,
    suggestion: () => ({ reps: null, weight: null, weightUnit: null }),
    unit: "lbs",
    rest: null,
    now: 0,
  });
  expect(tib.detail).toBe("Last 25 reps");
});
