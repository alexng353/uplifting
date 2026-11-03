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
  expect(targetSetCount({ lat: [4, 3, 4, 4, 3] }, {}, "lat")).toBe(4);
  expect(targetSetCount({ lat: [3, 4] }, {}, "lat")).toBe(4);
  expect(targetSetCount({ lat: [4, 3] }, {}, "lat")).toBe(3);
});

test("warm-up-only sessions are ignored", () => {
  expect(targetSetCount({ lat: [1, 1, 1, 4] }, {}, "lat")).toBe(4);
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
