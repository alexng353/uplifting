import { expect, mock, test } from "bun:test";

mock.module("@react-native-async-storage/async-storage", () => ({
  default: { setItem: async () => {}, removeItem: async () => {} },
}));
mock.module("expo-crypto", () => ({ randomUUID: () => crypto.randomUUID() }));
const { DEFAULT_REP_RANGES } = await import("../services/storage");
const { contrastOn, rangeErrors, REP_RANGE_PALETTE, swatchesFor } = await import("./rep-ranges");

const r = (label: string, min: number, max: number) => ({ label, min, max, color: "#EF4444" });

test("a saved colour outside the palette shows as a leading custom swatch", () => {
  const old = swatchesFor("#3b82f6");
  expect(old[0]).toEqual({ color: "#3b82f6", custom: true });
  expect(old).toHaveLength(REP_RANGE_PALETTE.length + 1);
  // Palette colours match case-insensitively and add nothing.
  expect(swatchesFor("#ef4444")).toHaveLength(REP_RANGE_PALETTE.length);
});

test("every default colour is in the palette", () => {
  for (const d of DEFAULT_REP_RANGES)
    expect(swatchesFor(d.color).some((s) => s.custom)).toBe(false);
});

test("the check mark contrasts with every swatch", () => {
  expect(contrastOn("#FFFFFF")).toBe("#1F0E04");
  expect(contrastOn("#F59E0B")).toBe("#1F0E04");
  expect(contrastOn("#6B7280")).toBe("#FFFFFF");
  expect(contrastOn("#8B5CF6")).toBe("#1F0E04");
});

test("flags bad min/max and overlaps, and passes the defaults", () => {
  expect(rangeErrors(DEFAULT_REP_RANGES)).toEqual(DEFAULT_REP_RANGES.map(() => null));
  expect(rangeErrors([r("a", 0, 3)])).toEqual(["Min must be at least 1"]);
  expect(rangeErrors([r("a", 5, 3)])).toEqual(["Max can't be below min"]);
  expect(rangeErrors([r("a", 1, 5), r("b", 5, 8)])).toEqual(["Overlaps b", "Overlaps a"]);
});
