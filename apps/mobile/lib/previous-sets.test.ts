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

test("uses defaults when only the other mode has history, including legacy caches", () => {
  const defaults = { weight: 20, reps: 10, weightUnit: null };
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
  expect(getPreviousSetSuggestion(history, "unknown", undefined, 1).weight).toBe(20);
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
