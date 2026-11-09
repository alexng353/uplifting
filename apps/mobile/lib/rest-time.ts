/** Default rest time typed in Settings: seconds ("75"), m:ss ("1:30") or 2m / 1m30s / 45s. */

export const REST_MIN_SECONDS = 10;
export const REST_MAX_SECONDS = 15 * 60;
/** Quick picks under the field. */
export const REST_PRESETS = [60, 90, 120, 180];

const clamp = (s: number) => Math.min(REST_MAX_SECONDS, Math.max(REST_MIN_SECONDS, s));

/** Seconds within 10 s - 15 min, or null when the text isn't a time (the field reverts). */
export function parseRestTime(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, "");
  if (!t) return null;
  let m = /^(\d{1,3})$/.exec(t);
  if (m) return clamp(Number(m[1]));
  m = /^(\d{1,2}):(\d{1,2})$/.exec(t);
  if (m) return Number(m[2]) < 60 ? clamp(Number(m[1]) * 60 + Number(m[2])) : null;
  m = /^(?:(\d{1,2})m)?(?:(\d{1,3})s?)?$/.exec(t);
  if (m && (m[1] || m[2]) && /[ms]/.test(t)) {
    return clamp(Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0));
  }
  return null;
}

/** 90 -> "1:30", 45 -> "0:45". */
export function formatRestTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
