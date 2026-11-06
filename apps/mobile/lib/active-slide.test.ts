import { expect, test } from "bun:test";

import { slideAfterRemoval } from "./active-slide";

// Alex, build 31: "deleting the middle exercise between two other exercises is buggy".
test("removing the middle of A, B, C shows C, which slid into B's place", () => {
  // On B (1), remove B: 2 exercises left, C is now index 1.
  expect(slideAfterRemoval(1, 1, 2)).toBe(1);
});

test("removing the last exercise shows the one before it", () => {
  expect(slideAfterRemoval(2, 2, 2)).toBe(1);
});

test("removing an exercise before the current one keeps the same exercise on screen", () => {
  expect(slideAfterRemoval(2, 0, 2)).toBe(1);
});

test("removing the only exercise shows Add Exercise", () => {
  expect(slideAfterRemoval(0, 0, 0)).toBe(0);
});
