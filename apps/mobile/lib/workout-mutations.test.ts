import { describe, expect, mock, test } from "bun:test";

mock.module("@react-native-async-storage/async-storage", () => ({
  default: { setItem: async () => {}, removeItem: async () => {}, getItem: async () => null },
}));
mock.module("expo-crypto", () => ({ randomUUID: () => crypto.randomUUID() }));
const { trimTrailingEmptySetsMutation } = await import("./workout-mutations");
const { toRows } = await import("./set-rows");

import type { StoredSet, StoredWorkout } from "../services/storage";

const set = (id: string, v: Partial<StoredSet> = {}): StoredSet => ({
  id,
  weightUnit: "lbs",
  createdAt: "2026-11-06T22:00:00Z",
  ...v,
});
const workout = (sets: StoredSet[]): StoredWorkout => ({
  id: "w",
  startTime: "2026-11-06T22:00:00Z",
  privacy: "friends",
  kind: "workout",
  exercises: [{ exerciseId: "ex", exerciseName: "Leg Extension", sets }],
});
const rowsAfterBlur = (sets: StoredSet[]) =>
  toRows(trimTrailingEmptySetsMutation(workout(sets), "ex", 1).exercises[0].sets);

// Alex, build 31: "If I add two sets (3 total no input), then input into the top one, it
// deletes my 3rd set". Leaving a field runs the auto-remove trim.
describe("sets he added himself survive leaving a field", () => {
  test("bilateral: type into set 1 of 3", () => {
    const rows = rowsAfterBlur([set("a", { reps: 6 }), set("b"), set("c")]);
    expect(rows).toHaveLength(3);
  });

  test("unilateral and split rows too", () => {
    const uni = (id: string, v: Partial<StoredSet> = {}) => [
      set(`${id}R`, { side: "R", layout: "combined", ...v }),
      set(`${id}L`, { side: "L", layout: "combined", ...v }),
    ];
    const split = (id: string, v: Partial<StoredSet> = {}) => [
      set(`${id}R`, { side: "R", ...v }),
      set(`${id}L`, { side: "L", ...v }),
    ];
    expect(rowsAfterBlur([...uni("1", { reps: 6 }), ...uni("2"), ...uni("3")])).toHaveLength(3);
    expect(rowsAfterBlur([...split("1", { reps: 6 }), ...split("2"), ...split("3")])).toHaveLength(
      3,
    );
  });

  test("a ghost row from adding the exercise is kept, with added rows after it", () => {
    expect(rowsAfterBlur([set("ghost"), set("b"), set("c")])).toHaveLength(3);
  });

  test("only rows the app auto-added are trimmed, and one is kept", () => {
    const rows = rowsAfterBlur([
      set("a", { reps: 6, weight: 100 }),
      set("b"),
      set("auto1", { autoAdded: true }),
      set("auto2", { autoAdded: true }),
    ]);
    expect(rows.map((r) => (r.kind === "bilateral" ? r.set.id : ""))).toEqual(["a", "b", "auto1"]);
  });
});
