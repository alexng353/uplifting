import { expect, test } from "bun:test";
import type { StoredSet } from "../services/storage";
import { countSetGroups, recordSetCount, targetSetCount } from "./target-sets";

function sets(n: number, side?: "L" | "R"): StoredSet[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${side ?? ""}${i}`,
    reps: 8,
    weight: 100,
    side,
    weightUnit: "lbs",
    createdAt: "2026-11-02",
  }));
}

test("the usual count wins, ties go to the most recent", () => {
  expect(targetSetCount({ lat_default: [4, 3, 4, 4, 3] }, {}, "lat")).toBe(4);
  expect(targetSetCount({ lat_default: [3, 4] }, {}, "lat")).toBe(4);
  expect(targetSetCount({ lat_default: [4, 3] }, {}, "lat")).toBe(3);
});

test("warm-up-only sessions are ignored and one big day does not take over", () => {
  expect(targetSetCount({ lat_default: [1, 1, 1, 4] }, {}, "lat")).toBe(4);
  expect(targetSetCount({ lat_default: [4, 4, 4, 4, 4, 4, 4, 10] }, {}, "lat")).toBe(4);
  expect(targetSetCount({ lat_default: [1, 1] }, {}, "lat")).toBe(1);
});

test("each profile keeps its own target", () => {
  const history = { lat_default: [3, 3], lat_cable: [5, 5] };
  expect(targetSetCount(history, {}, "lat")).toBe(3);
  expect(targetSetCount(history, {}, "lat", "cable")).toBe(5);
});

test("falls back to the cached last session, else no target", () => {
  expect(targetSetCount({}, { lat_default: sets(3) }, "lat")).toBe(3);
  expect(targetSetCount({}, { lat_cable: [...sets(2, "R"), ...sets(2, "L")] }, "lat")).toBe(2);
  expect(targetSetCount({}, { other_default: sets(5) }, "lat")).toBeNull();
  expect(targetSetCount({}, {}, "lat")).toBeNull();
});

test("records unilateral pairs as one set and keeps the last 8 sessions", () => {
  expect(countSetGroups([...sets(3, "R"), ...sets(2, "L")])).toBe(3);
  let history = {};
  for (let i = 1; i <= 10; i++) history = recordSetCount(history, "lat", sets(i));
  expect(history).toEqual({ lat: [3, 4, 5, 6, 7, 8, 9, 10] });
  expect(recordSetCount(history, "lat", [])).toBe(history);
});

// Alex's chest press before warmups were flagged: 6x100, 8x200, 6x200 counted 3 sets,
// so the ring sat one set too late.
test("history counts leave out warmups, flagged or by the 80% line", async () => {
  const { setCountsFromHistory } = await import("./target-sets");
  const s = (reps: number, weight: number, side?: "L" | "R", is_warmup?: boolean) => ({
    reps,
    weight,
    side,
    is_warmup,
  });
  expect(
    setCountsFromHistory([
      { sets: [s(6, 100), s(8, 200), s(6, 200)] },
      { sets: [s(6, 150, undefined, true), s(6, 200), s(6, 205)] },
      // Preacher curl per side: 25 R/L then 45 R/L twice = 2 working rows.
      {
        sets: [
          s(6, 25, "R"),
          s(6, 25, "L"),
          s(6, 45, "R"),
          s(6, 45, "L"),
          s(5, 45, "R"),
          s(5, 45, "L"),
        ],
      },
      { sets: [] },
    ]),
  ).toEqual([2, 2, 2]);
});
