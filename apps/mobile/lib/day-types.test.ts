import { describe, expect, test } from "bun:test";

import {
  listFromSessions,
  nextDayType,
  nextListed,
  rankForDay,
  seedDayTypes,
  sessionsForDay,
  titleKind,
} from "./day-types";
import { rankExercises } from "./exercise-rank";

// Most recent first, like the stored sequences. Alex: upper/lower 4x a week.
const seqs = [
  { title: "Upper", exerciseIds: ["chest", "row", "curl", "pushdown"] },
  { title: "Leg day", exerciseIds: ["pendulum", "legext", "legcurl"] },
  { title: "Upper", exerciseIds: ["chest", "row", "lateral", "curl"] },
  { title: "leg day", exerciseIds: ["pendulum", "legcurl", "calf"] },
  { title: "Workout", exerciseIds: ["curl", "pendulum"] },
];

describe("day types", () => {
  test("titles map to upper or lower", () => {
    expect(titleKind("Leg day")).toBe("lower");
    expect(titleKind("Pull day")).toBe("upper");
    expect(titleKind("Workout")).toBeNull();
    expect(sessionsForDay({ name: "Lower" }, seqs)).toHaveLength(2);
  });

  test("seeded from history: in at least half the sessions, usual order", () => {
    const [upper, lower] = seedDayTypes(seqs);
    expect(upper.exerciseIds).toEqual(["chest", "row", "lateral", "curl", "pushdown"]);
    expect(lower.exerciseIds).toEqual(["pendulum", "legext", "legcurl", "calf"]);
    expect(listFromSessions([])).toEqual([]);
  });

  test("rotation: after Upper comes Lower", () => {
    const days = seedDayTypes(seqs);
    expect(nextDayType(days, seqs)?.name).toBe("Lower");
    expect(nextDayType(days, seqs.slice(1))?.name).toBe("Upper");
    expect(nextDayType(days, [])?.name).toBe("Upper");
  });

  test("a Lower day suggests its own list first, never upper history first", () => {
    const [, lower] = seedDayTypes(seqs);
    const ranked = rankForDay(lower, seqs, ["pendulum"], rankExercises, 5);
    expect(ranked.slice(0, 3)).toEqual(["legext", "legcurl", "calf"]);
    expect(nextListed(lower, ["pendulum"])).toBe("legext");
    expect(nextListed(lower, lower.exerciseIds)).toBeNull();
  });
});

test("a day label is inferred after two logged exercises", async () => {
  const { inferDayTitle } = await import("./day-types");
  const muscles: Record<string, string[]> = {
    pendulum: ["quadriceps, vastus lateralis", "gluteus maximus"],
    legcurl: ["hamstrings, biceps femoris long head"],
    chest: ["pectoralis major"],
  };
  const m = (id: string) => muscles[id] ?? [];
  expect(inferDayTitle(["pendulum"], m)).toBeNull();
  expect(inferDayTitle(["pendulum", "legcurl"], m)).toBe("Leg day");
  expect(inferDayTitle(["chest", "pendulum"], m)).toBe("Upper");
});

test("lower day: skipped accessories come right after the compounds", async () => {
  const { orderLowerDay } = await import("./day-types");
  const names: Record<string, string> = {
    pend: "Pendulum Squat",
    curl: "Seated Leg Curl",
    calf: "Calf Raise",
    add: "Hip Adductor",
    ext: "Leg Extension",
    back: "45° Back Extension",
    rdl: "Romanian Deadlift",
  };
  expect(
    orderLowerDay(["pend", "curl", "rdl", "calf", "add", "ext", "back"], (id) => names[id]),
  ).toEqual(["pend", "rdl", "add", "ext", "back", "curl", "calf"]);
});
