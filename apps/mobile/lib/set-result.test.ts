import { describe, expect, test } from "bun:test";
import { compareSet, worseResult } from "./set-result";

test("compares on estimated 1RM, not field by field", () => {
  // 8x135 (~171) vs suggested 6x140 (168) is above, though the weight is lower.
  expect(compareSet({ reps: 8, weight: 135 }, { reps: 6, weight: 140 }, "lbs")).toBe("above");
  expect(compareSet({ reps: 4, weight: 135 }, { reps: 6, weight: 145 }, "lbs")).toBe("below");
  expect(compareSet({ reps: 6, weight: 220 }, { reps: 6, weight: 220 }, "lbs")).toBe("same");
});

test("a small difference counts as same, and units convert", () => {
  expect(compareSet({ reps: 6, weight: 221 }, { reps: 6, weight: 220 }, "lbs")).toBe("same");
  expect(
    compareSet({ reps: 5, weight: 100 }, { reps: 5, weight: 220, weightUnit: "lbs" }, "kg"),
  ).toBe("same");
});

test("no suggestion or no reps gives no result; bodyweight compares reps", () => {
  expect(compareSet({ reps: 6, weight: 100 }, { reps: null, weight: null }, "kg")).toBeNull();
  expect(compareSet({ reps: null, weight: 100 }, { reps: 6, weight: 100 }, "kg")).toBeNull();
  expect(compareSet({ reps: 12, weight: 0 }, { reps: 10, weight: 0 }, "kg")).toBe("above");
});

test("a two-sided row shows its worse side", () => {
  expect(worseResult(["above", "below"])).toBe("below");
  expect(worseResult(["above", "same"])).toBe("same");
  expect(worseResult(["above", null])).toBe("above");
  expect(worseResult([null, null])).toBeNull();
});

describe("same-set tolerance is 1.5% of estimated 1RM", () => {
  const vs100 = (weight: number) =>
    compareSet({ reps: 10, weight }, { reps: 10, weight: 100, weightUnit: "lbs" }, "lbs");

  test("Alek: 450x6 after 440x7 is the same, not down", () => {
    expect(
      compareSet({ reps: 6, weight: 450 }, { reps: 7, weight: 440, weightUnit: "lbs" }, "lbs"),
    ).toBe("same");
  });

  test("within 1.5% either way is the same", () => {
    expect(vs100(98.6)).toBe("same");
    expect(vs100(101.4)).toBe("same");
  });

  test("outside 1.5% is up or down", () => {
    expect(vs100(98.4)).toBe("below");
    expect(vs100(101.6)).toBe("above");
  });
});

// Alex, 2026-11-09: double progression. "Week1: 6x40, 2: 7x40, 3: 8x40, 4: 6x45".
describe("rep-range comparison (double progression)", () => {
  const vs = (reps: number, weight: number, sReps: number, sWeight: number, floor = 6) =>
    compareSet({ reps, weight }, { reps: sReps, weight: sWeight, weightUnit: "lbs" }, "lbs", floor);

  test("his weeks are all progress", () => {
    expect(vs(7, 40, 6, 40)).toBe("above");
    expect(vs(8, 40, 7, 40)).toBe("above");
    expect(vs(6, 45, 8, 40)).toBe("above");
  });

  test("a heavier set back at the bottom of the range is up, even on a heavy lift", () => {
    // e1RM alone calls these down or same.
    expect(vs(6, 205, 8, 200)).toBe("above");
    expect(vs(6, 42.5, 8, 40)).toBe("above");
  });

  test("same weight: reps decide", () => {
    expect(vs(6, 40, 6, 40)).toBe("same");
    expect(vs(5, 40, 6, 40)).toBe("below");
  });

  test("lighter is down unless it beats last time by more than 1.5%", () => {
    expect(vs(8, 38, 8, 40)).toBe("below");
    expect(vs(12, 135, 6, 140)).toBe("above");
  });

  test("heavier but below the range falls back to e1RM", () => {
    expect(vs(3, 210, 8, 200)).toBe("below");
  });
});

describe("rep range floor from history", () => {
  test("lowest working reps over the last 3 sessions, warmups out, fallback 6", async () => {
    const { repFloorFromHistory } = await import("./set-result");
    const s = (reps: number, weight: number, is_warmup?: boolean) => ({ reps, weight, is_warmup });
    const history = [
      { sets: [s(4, 200)] }, // 4th newest: ignored
      { sets: [s(10, 100), s(7, 200), s(8, 200)] }, // 10x100 is a warmup by the 80% line
      { sets: [s(3, 150, true), s(8, 205)] },
      { sets: [s(6, 210), s(7, 210)] },
    ];
    expect(repFloorFromHistory(history)).toBe(6);
    expect(repFloorFromHistory(history.slice(0, 3))).toBe(4);
    expect(repFloorFromHistory([])).toBe(6);
  });
});
