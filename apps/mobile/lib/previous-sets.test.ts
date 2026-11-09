import { expect, test } from "bun:test";
import type { StoredSet } from "../services/storage";
import { getPreviousSetSuggestion } from "./previous-sets";

function set(weight: number, side?: "L" | "R", reps = 10): StoredSet {
  return { id: String(weight), weight, reps, side, weightUnit: "lbs", createdAt: "2026-09-07" };
}

test("suggests each mode's own sets, including side and set number", () => {
  const history = {
    press_default: [set(200), set(210), set(100, "R"), set(95, "L"), set(105, "R", 8)],
  };
  expect(getPreviousSetSuggestion(history, "press", undefined, 1)).toEqual({
    weight: 200,
    reps: 10,
    weightUnit: "lbs",
  });
  expect(getPreviousSetSuggestion(history, "press", undefined, 2).weight).toBe(210);
  expect(getPreviousSetSuggestion(history, "press", undefined, 3).weight).toBe(210);
  expect(getPreviousSetSuggestion(history, "press", undefined, 1, "R").weight).toBe(100);
  expect(getPreviousSetSuggestion(history, "press", undefined, 1, "L").weight).toBe(95);
  expect(getPreviousSetSuggestion(history, "press", undefined, 3, "R")).toEqual({
    weight: 105,
    reps: 8,
    weightUnit: "lbs",
  });
});

test("suggests nothing when only the other mode has history, including legacy caches", () => {
  const defaults = { weight: null, reps: null, weightUnit: null };
  expect(
    getPreviousSetSuggestion({ press_default: [set(100, "R")] }, "press", undefined, 1),
  ).toEqual(defaults);
  for (const side of ["L", "R"] as const) {
    expect(
      getPreviousSetSuggestion({ press_default: [set(200)] }, "press", undefined, 1, side),
    ).toEqual(defaults);
  }
  expect(getPreviousSetSuggestion({}, "press", undefined, 1)).toEqual(defaults);
});

test("profile fallbacks search for the requested mode and stay within the exercise", () => {
  const history = {
    press_current: [set(100, "R")],
    press_wrongMode: [set(110, "R")],
    other_default: [set(400)],
    press_matchingMode: [set(200)],
    press_alternative: [set(220), set(120, "R")],
  };
  expect(getPreviousSetSuggestion(history, "press", "current", 1).weight).toBe(200);
  expect(getPreviousSetSuggestion(history, "press", "current", 1, "R").weight).toBe(100);
  expect(getPreviousSetSuggestion(history, "press", "alternative", 1).weight).toBe(220);
  expect(getPreviousSetSuggestion(history, "press", "missing", 1).weight).toBe(200);
  expect(getPreviousSetSuggestion(history, "unknown", undefined, 1).weight).toBeNull();
});

test("keeps a missing weight missing instead of inventing one", () => {
  const repsOnly: StoredSet = { id: "1", reps: 12, weightUnit: "kg", createdAt: "2026-09-07" };
  expect(getPreviousSetSuggestion({ pullup_default: [repsOnly] }, "pullup", undefined, 1)).toEqual({
    reps: 12,
    weight: null,
    weightUnit: "kg",
  });
});

test("a missing side may use the other unilateral side, never bilateral sets", () => {
  expect(
    getPreviousSetSuggestion(
      { press_default: [set(200), set(95, "L")] },
      "press",
      undefined,
      1,
      "R",
    ).weight,
  ).toBe(95);
});

// Yolanda, build 33: last session 6x40, 6x60, 6x60 (before warmups were flagged). With
// today's 6x40 as w1, working set 1 suggested 40 instead of 60.
test("an unflagged old session splits at 80% of its top weight", async () => {
  const { lastWarmupCount } = await import("./previous-sets");
  const history = {
    chest_default: [set(40, undefined, 6), set(60, undefined, 6), set(60, undefined, 6)],
  };
  expect(getPreviousSetSuggestion(history, "chest", undefined, 1).weight).toBe(60);
  expect(getPreviousSetSuggestion(history, "chest", undefined, 2).weight).toBe(60);
  expect(
    getPreviousSetSuggestion(history, "chest", undefined, 1, undefined, { warmup: true }).weight,
  ).toBe(40);
  expect(lastWarmupCount(history, "chest", undefined)).toBe(1);
});

test("flagged sessions split by their flags", () => {
  const history = {
    chest_default: [{ ...set(150), warmup: true }, set(155), set(200)],
  };
  expect(getPreviousSetSuggestion(history, "chest", undefined, 1).weight).toBe(155);
  expect(
    getPreviousSetSuggestion(history, "chest", undefined, 1, undefined, { warmup: true }).weight,
  ).toBe(150);
});

test("rows take warmup or working slots", async () => {
  const { suggestionSlot } = await import("./previous-sets");
  // Fresh exercise, last time had one warmup: the first empty row offers the warmup.
  expect(suggestionSlot(["working"], [false], 0, 1)).toEqual({ warmup: true, n: 1 });
  // Yolanda: w1 logged, the next empty row is working set 1.
  const kinds = ["warmup", "working", "working"] as const;
  expect(suggestionSlot(kinds, [true, false, false], 1, 1)).toEqual({ warmup: false, n: 1 });
  expect(suggestionSlot(kinds, [true, false, false], 2, 1)).toEqual({ warmup: false, n: 2 });
  expect(suggestionSlot(kinds, [true, false, false], 0, 1)).toEqual({ warmup: true, n: 1 });
  // No warmups last time: plain working numbers.
  expect(suggestionSlot(["working", "working"], [true, false], 1, 0)).toEqual({
    warmup: false,
    n: 2,
  });
});
