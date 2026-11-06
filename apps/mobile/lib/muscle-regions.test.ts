import { expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { muscleIds } from "../components/muscles/renderMuscles";
import { heatColours, regionLoad, regionsFor } from "./muscle-regions";

test("every muscle the exercise catalog uses draws on a real map region", () => {
  const catalog = JSON.parse(
    readFileSync(
      join(import.meta.dir, "../../../scripts/exercise-eval/fixtures/catalog.json"),
      "utf8",
    ),
  ) as { exercises: { muscles?: { name: string }[] }[] };
  const names = new Set(catalog.exercises.flatMap((e) => (e.muscles ?? []).map((m) => m.name)));
  expect(names.size).toBeGreaterThan(50);
  const known = new Set<string>(muscleIds);
  const unmapped = [...names].filter((n) => regionsFor(n).length === 0);
  expect(unmapped).toEqual([]);
  for (const n of names) {
    for (const r of regionsFor(n)) expect(known.has(`left${r}`)).toBe(true);
  }
});

test("primary sets count fully, secondary half, once per region per exercise", () => {
  const load = regionLoad([
    {
      sets: 4,
      primary: ["quadriceps, vastus lateralis", "quadriceps, rectus femoris"],
      secondary: ["gluteus maximus"],
    },
    { sets: 2, primary: ["gluteus maximus"], secondary: ["hamstrings, semitendinosus"] },
    { sets: 0, primary: ["pectoralis major"], secondary: [] },
  ]);
  expect(Object.fromEntries(load)).toEqual({ Quad: 4, Glute: 4, Hamstring: 1 });
});

test("heat colours both sides on an Ember ramp, brightest for the busiest region", () => {
  const colours = heatColours(
    new Map([
      ["Quad", 10],
      ["Calf", 1],
    ]),
  );
  const byMuscle = Object.fromEntries(colours.map((c) => [c.muscle, c.colour]));
  expect(byMuscle.leftQuad).toBe("#F2894B");
  expect(byMuscle.rightQuad).toBe("#F2894B");
  expect(byMuscle.leftCalf).toBe("#5C2D13");
  expect(heatColours(new Map())).toEqual([]);
});
