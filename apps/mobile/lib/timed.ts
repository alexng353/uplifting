import type { StoredSet } from "../services/storage";

/**
 * Timed sets (treadmill walks and other cardio accessories). On the server a timed set
 * is a normal set with reps 1 and weight 0, so every "reps > 0" rule (finish, sync,
 * the gate's six-set count) keeps working; the duration is what was actually done.
 */

export type Measure = "weights" | "timed";

export function isTimedSet(set: Pick<StoredSet, "durationSeconds">): boolean {
  return set.durationSeconds != null && set.durationSeconds > 0;
}

/** 600 -> "10:00", 3725 -> "1:02:05". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/**
 * What the duration field accepts while typing: "10" is ten minutes, "10:30" or
 * "10.30" is ten and a half. Undefined for empty or unreadable text.
 */
export function parseDuration(text: string): number | undefined {
  const t = text.trim().replace(".", ":");
  if (t === "") return undefined;
  const m = /^(\d{1,3})(?::(\d{0,2}))?$/.exec(t);
  if (!m) return undefined;
  const minutes = Number(m[1]);
  const seconds = m[2] ? Number(m[2]) : 0;
  if (seconds > 59) return undefined;
  const total = minutes * 60 + seconds;
  return total > 0 ? total : undefined;
}

/** Treadmill speed follows the weight unit: lbs -> mph, kg -> km/h. */
export function speedUnitFor(displayUnit: string): "mph" | "km/h" {
  return displayUnit === "lbs" ? "mph" : "km/h";
}

/** Distance covered at a steady speed, in mi for mph and km for km/h. */
export function distanceFor(speed: number, seconds: number): number {
  return Math.round(((speed * seconds) / 3600) * 1000) / 1000;
}

const trim = (n: number) => String(Math.round(n * 100) / 100);

/** "10:00 · 3.5 mph · 3.5%". */
export function formatTimedSet(
  set: Pick<StoredSet, "durationSeconds" | "speed" | "speedUnit" | "incline">,
): string {
  const parts = [formatDuration(set.durationSeconds ?? 0)];
  if (set.speed != null) parts.push(`${trim(set.speed)} ${set.speedUnit ?? "mph"}`);
  if (set.incline != null) parts.push(`${trim(set.incline)}%`);
  return parts.join(" · ");
}

/**
 * The stored values for a timed set from what was typed: reps 1 and weight 0 once
 * there is a duration (so it counts as logged), cleared again when it is removed.
 */
export function timedUpdate(
  durationSeconds: number | undefined,
  speed: number | undefined,
  speedUnit: string,
  incline: number | undefined,
): Partial<StoredSet> {
  // Clamp to what a treadmill can do (and what the columns hold): a typo like 1000 must
  // not fail the whole workout's sync.
  const clamp = (v: number | undefined, lo: number, hi: number) =>
    v == null ? v : Math.min(hi, Math.max(lo, v));
  durationSeconds = clamp(durationSeconds, 0, 86400);
  speed = clamp(speed, 0, 99.9);
  incline = clamp(incline, -30, 99.9);
  const logged = durationSeconds != null && durationSeconds > 0;
  return {
    durationSeconds,
    speed,
    speedUnit: speed != null ? speedUnit : undefined,
    incline,
    distance: logged && speed != null ? distanceFor(speed, durationSeconds ?? 0) : undefined,
    distanceUnit: logged && speed != null ? (speedUnit === "mph" ? "mi" : "km") : undefined,
    reps: logged ? 1 : undefined,
    weight: logged ? 0 : undefined,
  };
}

/** A weight set's short label; bodyweight-only sets read "25 reps", not "25×0". */
export function liftLabel(reps: number, weight: number, unit: string): string {
  if (!(weight > 0)) return `${trim(reps)} reps`;
  return `${trim(reps)}×${Math.round(weight * 10) / 10} ${unit}`;
}

const num = (v: unknown): number | undefined =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? undefined : Number(v);

/** Timed fields from a server set (sync/bootstrap snake_case or drizzle camelCase). */
export function timedFromServer(s: Record<string, any>): Partial<StoredSet> {
  const warm = (s.is_warmup ?? s.isWarmup) === true ? { warmup: true } : {};
  const durationSeconds = num(s.duration_seconds ?? s.durationSeconds);
  if (durationSeconds == null) return warm;
  return {
    ...warm,
    durationSeconds,
    speed: num(s.speed),
    speedUnit: (s.speed_unit ?? s.speedUnit) || undefined,
    incline: num(s.incline),
    distance: num(s.distance),
    distanceUnit: (s.distance_unit ?? s.distanceUnit) || undefined,
  };
}

/** Timed fields for a sync or edit request; nothing for a weight set. */
export function timedToServer(s: StoredSet) {
  // Warmup sets are sent flagged; the server leaves them out of volume and PRs.
  const warm = { is_warmup: s.warmup === true };
  if (!isTimedSet(s)) return warm;
  return {
    ...warm,
    duration_seconds: s.durationSeconds,
    speed: s.speed,
    speed_unit: s.speedUnit,
    incline: s.incline,
    distance: s.distance,
    distance_unit: s.distanceUnit,
  };
}
