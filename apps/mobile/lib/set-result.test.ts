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
