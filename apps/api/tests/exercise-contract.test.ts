import { test, expect } from "bun:test";
import { validateResult } from "../src/exercise-agent/contract";
const draft = {
  name: "Incline Smith Machine Bench Press",
  exercise_type: "machine",
  description: "Incline press.",
  movement_pattern: "horizontal_push",
  muscle_group: "chest",
  primary_muscles: ["pectoralis major"],
  secondary_muscles: ["anterior deltoid"],
};
const muscles = [{ name: "pectoralis major" }, { name: "anterior deltoid" }];
test("accepts draft with known taxonomy", () =>
  expect(validateResult({ kind: "draft", message: "Ready", draft }, muscles).draft).toEqual(draft));
test("rejects unknown muscles and overlapping assignments", () => {
  expect(() =>
    validateResult(
      { kind: "draft", message: "Ready", draft: { ...draft, primary_muscles: ["invented"] } },
      muscles,
    ),
  ).toThrow();
  expect(() =>
    validateResult(
      {
        kind: "draft",
        message: "Ready",
        draft: { ...draft, secondary_muscles: draft.primary_muscles },
      },
      muscles,
    ),
  ).toThrow();
});
test("clarification cannot smuggle a publishable draft", () =>
  expect(() =>
    validateResult({ kind: "clarification", message: "Which incline?", draft }, muscles),
  ).toThrow());
test("rejects invalid type and blank names", () => {
  for (const patch of [{ exercise_type: "smith" }, { name: "  " }, { primary_muscles: [] }])
    expect(() =>
      validateResult({ kind: "draft", message: "Ready", draft: { ...draft, ...patch } }, muscles),
    ).toThrow();
});
