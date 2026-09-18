import { expect, test } from "bun:test";
import catalog from "./fixtures/catalog.json";
import { split, modelInput, score, overlap, aggregate } from "./core";

test("deterministic, disjoint holdout excludes all gold from every prompt catalog", () => {
  const a = split(catalog);
  expect(a).toEqual(split(catalog));
  expect(a.training.length + a.cases.filter((c) => c.gold).length).toBe(catalog.exercises.length);
  for (const c of a.cases) {
    const input = modelInput(catalog, a.cases, a.training, c);
    expect(input.catalog.some((e) => a.cases.some((c) => c.gold?.id === e.id))).toBe(false);
    expect(Object.keys(input.catalog[0]!)).toEqual(["id", "name", "exercise_type"]);
  }
  expect(() => modelInput(catalog, a.cases, [a.cases[0]!.gold!], a.cases[0]!)).toThrow("leaked");
});
test("precision and recall distinguish excess and missing muscles", () => {
  expect(overlap(["a", "b"], ["a"])).toEqual({ precision: 0.5, recall: 1 });
  expect(overlap(["a"], ["a", "b"])).toEqual({ precision: 1, recall: 0.5 });
});
test("missing gold classification excludes only that metric and failures count", () => {
  const gold = { ...catalog.exercises[0]!, movement_pattern: null };
  const metrics = score({ id: gold.id, request: "", expected: "draft", gold }, null, false);
  expect(metrics.movement_pattern).toBe(null);
  expect(metrics.schema).toBe(0);
  expect(metrics.exercise_type).toBe(0);
  expect(metrics.primary_muscles_recall).toBe(0);
  expect(aggregate([{ metrics }]).movement_pattern).toEqual({
    mean: null,
    n: 0,
  });
});
test("clarification cases do not contribute invented classification failures", () => {
  expect(
    score(
      { id: "x", request: "press", expected: "clarification" },
      { kind: "clarification" },
      true,
    ),
  ).toEqual({ schema: 1, response_kind: 1 });
});
test("perfect valid draft scores each available catalog field separately", () => {
  const gold = catalog.exercises.find((e) => e.movement_pattern && e.muscle_group)!;
  const result = {
    kind: "draft",
    draft: {
      ...gold,
      primary_muscles: gold.muscles.filter((m) => m.is_primary).map((m) => m.name),
      secondary_muscles: gold.muscles.filter((m) => !m.is_primary).map((m) => m.name),
    },
  };
  const metrics = score({ id: gold.id, request: "", expected: "draft", gold }, result, true);
  expect(Object.values(metrics).every((value) => value === 1)).toBe(true);
});
