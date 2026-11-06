import { expect, test } from "bun:test";
import { compareSet, worseResult } from "./set-result";

test("compares on estimated 1RM, not field by field", () => {
  // 8x135 (~171) vs suggested 6x140 (168) is above, though the weight is lower.
  expect(compareSet({ reps: 8, weight: 135 }, { reps: 6, weight: 140 }, "lbs")).toBe("above");
  expect(compareSet({ reps: 4, weight: 135 }, { reps: 6, weight: 145 }, "lbs")).toBe("below");
  expect(compareSet({ reps: 6, weight: 220 }, { reps: 6, weight: 220 }, "lbs")).toBe("same");
});

test("within 1% counts as same, and units convert", () => {
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
