/**
 * Helpers for decimal-friendly numeric text inputs.
 *
 * The naive `value={String(n)}` + `onChangeText={(t) => setN(Number(t))}` pairing
 * eats in-progress decimals: typing "2." parses to 2, which stringifies back to
 * "2" and drops the period. It only bites *sometimes* because React Native skips
 * pushing text down to the native input when the `value` prop is unchanged from
 * the previous render — so the period survives locally until some unrelated
 * re-render (an auto-added set, a sync, a settings write) pushes the canonical
 * string back and truncates what the user was typing.
 *
 * The fix is to keep the raw draft string in component state and only derive a
 * number from it, never the other way around while the field is being edited.
 */

/**
 * Reduce raw keyboard input to a parseable decimal string. Locale keyboards emit
 * "," as the decimal separator, so it is normalized to "."; everything that is
 * not a digit or the first period is dropped.
 */
export function sanitizeNumericText(raw: string): string {
  const stripped = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const firstDot = stripped.indexOf(".");
  if (firstDot === -1) return stripped;
  return stripped.slice(0, firstDot + 1) + stripped.slice(firstDot + 1).replace(/\./g, "");
}

/**
 * Best number for a (sanitized) draft string. Partial input that is not yet a
 * number — "", ".", "" after a delete — yields undefined; "2." yields 2 so the
 * value stays live while the user is still typing the fractional part.
 */
export function parseNumericText(text: string): number | undefined {
  if (!text || text === ".") return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Canonical display string for a committed value: 2.5 → "2.5", nullish → "". */
export function formatNumericValue(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "" : String(value);
}
