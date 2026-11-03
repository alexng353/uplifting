import { expect, test } from "bun:test";
import type { StoredSet } from "../services/storage";
import { convertRow, fromRows, rowMode, toRows } from "./set-rows";

const set = (id: string, side?: "L" | "R", reps?: number, layout?: "combined"): StoredSet => ({
  id,
  side,
  reps,
  layout,
  weightUnit: "kg",
  createdAt: "2026-11-03",
});
let n = 0;
const newId = () => `new${++n}`;

test("reads mixed exercises, older R..L lists and server nulls", () => {
  const mixed = [
    set("b1", undefined, 8),
    set("b2"),
    set("r", "R", 6, "combined"),
    set("l", "L", 5, "combined"),
  ];
  expect(toRows(mixed).map(rowMode)).toEqual(["bilateral", "bilateral", "unilateral"]);
  const legacy = toRows([set("r1", "R"), set("r2", "R"), set("l1", "L"), set("l2", "L")]);
  expect(legacy.map((r) => r.kind === "sided" && [r.right?.id, r.left?.id, r.layout])).toEqual([
    ["r1", "l1", "split"],
    ["r2", "l2", "split"],
  ]);
  expect(toRows([{ ...set("x"), side: null as never }]).map(rowMode)).toEqual(["bilateral"]);
});

test("rows write back R then L per row and round-trip", () => {
  const sets = [
    set("b1", undefined, 8),
    set("r", "R", 6, "combined"),
    set("l", "L", 5, "combined"),
  ];
  expect(fromRows(toRows(sets))).toEqual(
    sets.map((s) =>
      s.layout ? s : { id: s.id, reps: s.reps, weightUnit: "kg", createdAt: "2026-11-03" },
    ),
  );
});

test("switching a row keeps its values where they map", () => {
  const [bi] = toRows([{ ...set("b", undefined, 8), weight: 40 }]);
  const uni = convertRow(bi, "unilateral", newId);
  expect(uni).toMatchObject({
    kind: "sided",
    layout: "combined",
    right: { id: "b", reps: 8, weight: 40, side: "R" },
    left: { reps: 8, weight: 40, side: "L" },
  });
  const split = convertRow(uni, "split", newId);
  expect(rowMode(split)).toBe("split");
  const back = convertRow(
    { ...split, left: { ...(split as any).left, reps: 7 } } as never,
    "bilateral",
    newId,
  );
  expect(back).toMatchObject({ kind: "bilateral", set: { id: "b", reps: 8, weight: 40 } });
  expect((back as any).set.side).toBeUndefined();
});
