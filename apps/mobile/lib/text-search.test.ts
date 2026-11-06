import { expect, test } from "bun:test";

import { matchesSearch } from "./text-search";

const names = ["Machine Preacher Curl", "Seated Leg Curl", "Pendulum Squat", "Tricep Pushdown"];

test("case-insensitive substring", () => {
  expect(names.filter((n) => matchesSearch(n, "curl"))).toEqual([
    "Machine Preacher Curl",
    "Seated Leg Curl",
  ]);
  expect(names.filter((n) => matchesSearch(n, "PUSH"))).toEqual(["Tricep Pushdown"]);
});

test("every word must match, in any order", () => {
  expect(names.filter((n) => matchesSearch(n, "curl leg"))).toEqual(["Seated Leg Curl"]);
  expect(names.filter((n) => matchesSearch(n, "  "))).toEqual(names);
});
