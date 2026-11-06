import type { RepRangeConfig } from "../services/storage";

/** Swatches on the Rep Range Colors screen. Data colours, not the Ember accent. */
export const REP_RANGE_PALETTE = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#22C55E",
  "#5DB4FF",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
  "#FFFFFF",
] as const;

export function sameColor(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * The swatches for one range. A saved colour that isn't in the palette (e.g. the old
 * default blue) leads the row as its own swatch, so it still shows as selected and the
 * user's choice is never changed behind their back.
 */
export function swatchesFor(color: string): { color: string; custom: boolean }[] {
  const palette = REP_RANGE_PALETTE.map((c) => ({ color: c as string, custom: false }));
  return palette.some((s) => sameColor(s.color, color))
    ? palette
    : [{ color, custom: true }, ...palette];
}

/** Dark ink or white, whichever reads better on the swatch (WCAG relative luminance). */
export function contrastOn(color: string): "#1F0E04" | "#FFFFFF" {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return "#FFFFFF";
  const n = parseInt(m[1], 16);
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  // Contrast vs white is 1.05/(l+.05); vs ink (~l 0.006) is (l+.05)/0.056.
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.056 ? "#FFFFFF" : "#1F0E04";
}

/**
 * Problems per range (null when fine). A set of ranges saves only when every entry is
 * null: min at least 1, min not above max, and no two ranges sharing a rep count.
 */
export function rangeErrors(ranges: readonly RepRangeConfig[]): (string | null)[] {
  return ranges.map((r, i) => {
    if (!Number.isInteger(r.min) || r.min < 1) return "Min must be at least 1";
    if (!Number.isInteger(r.max) || r.max < r.min) return "Max can't be below min";
    const other = ranges.findIndex((o, j) => j !== i && o.min <= r.max && r.min <= o.max);
    if (other >= 0) return `Overlaps ${ranges[other].label || `range ${other + 1}`}`;
    return null;
  });
}
