import { describe, expect, test } from "bun:test";

import { classifyRows, lastWorkingWeight, newWorkingStart } from "./warmup";

const bi = (weight: number | null, done = true, flag?: boolean) => ({
  mode: "bi" as const,
  weight,
  done,
  flag,
});

describe("warmup classification", () => {
  test("warmup until ~80% of last session's working weight, then working", () => {
    // Last time topped at 145; 45 and 90 are warmups, 135 (93%) starts working.
    expect(classifyRows([bi(45), bi(90), bi(135), bi(145)], { bi: 145 }, true)).toEqual([
      "warmup",
      "warmup",
      "working",
      "working",
    ]);
    // Once working, a lighter back-off set stays working.
    expect(classifyRows([bi(135), bi(90)], { bi: 145 }, true)).toEqual(["working", "working"]);
  });

  test("undone rows, first-ever sessions and ineligible exercises are never auto-warmup", () => {
    expect(classifyRows([bi(45), bi(null, false)], { bi: 145 }, true)).toEqual([
      "warmup",
      "working",
    ]);
    expect(classifyRows([bi(45)], {}, true)).toEqual(["working"]);
    expect(classifyRows([bi(45)], { bi: 145 }, false)).toEqual(["working"]);
  });

  test("a long-press flag wins and moves the line", () => {
    expect(classifyRows([bi(45, true, false), bi(50)], { bi: 145 }, true)).toEqual([
      "working",
      "working",
    ]);
    expect(classifyRows([bi(140, true, true), bi(140)], { bi: 145 }, true)).toEqual([
      "warmup",
      "working",
    ]);
    expect(classifyRows([bi(140, true, true)], {}, false)).toEqual(["warmup"]);
  });

  test("modes compare with their own history", () => {
    const rows = [bi(100), { mode: "side" as const, weight: 40, done: true }];
    expect(classifyRows(rows, { bi: 100, side: 45 }, true)).toEqual(["working", "working"]);
    expect(classifyRows(rows, { bi: 100, side: 100 }, true)).toEqual(["working", "warmup"]);
  });

  test("last working weight skips warmups and other modes", () => {
    const prev = [{ weight: 200, warmup: true }, { weight: 145 }, { weight: 60, side: "R" }];
    expect(lastWorkingWeight(prev, "bi")).toBe(145);
    expect(lastWorkingWeight(prev, "side")).toBe(60);
    expect(lastWorkingWeight([], "bi")).toBeNull();
  });

  test("the toast fires once, when the line is first crossed", () => {
    expect(
      newWorkingStart(["warmup", "working"], ["warmup", "working"], [true, false], [true, true]),
    ).toBe(1);
    expect(
      newWorkingStart(
        ["warmup", "working", "working"],
        ["warmup", "working", "working"],
        [true, true, false],
        [true, true, true],
      ),
    ).toBeNull();
    // Typing 120 goes 1 -> 12 -> 120: the row is "done" from the first digit, as a warmup.
    expect(
      newWorkingStart(["warmup", "warmup"], ["warmup", "working"], [true, true], [true, true]),
    ).toBe(1);
  });
});
