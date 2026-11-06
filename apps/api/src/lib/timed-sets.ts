/**
 * Timed sets (treadmill walks and other cardio accessories). A timed set is a normal
 * user_sets row with reps 1 and weight 0, so volume, set counts and the gate feed's
 * ≥6-sets rule read it unchanged; the columns below say what was done.
 */

export interface TimedInput {
  duration_seconds?: number;
  speed?: number;
  speed_unit?: string;
  incline?: number;
  distance?: number;
  distance_unit?: string;
}

/** Insert values for the timed columns; nothing at all for a weight set. */
export function timedValues(s: TimedInput) {
  if (s.duration_seconds == null) return {};
  return {
    durationSeconds: Math.round(s.duration_seconds),
    speed: s.speed != null ? String(s.speed) : null,
    speedUnit: s.speed != null ? (s.speed_unit ?? null) : null,
    incline: s.incline != null ? String(s.incline) : null,
    distance: s.distance != null ? String(s.distance) : null,
    distanceUnit: s.distance != null ? (s.distance_unit ?? null) : null,
  };
}

/**
 * The timed fields of a raw SQL row as API output. Weight sets get no keys, so their
 * JSON is byte-for-byte what older apps already read.
 */
export function timedColumns(row: Record<string, unknown>): {
  duration_seconds?: number;
  speed?: number | null;
  speed_unit?: string | null;
  incline?: number | null;
  distance?: number | null;
  distance_unit?: string | null;
} {
  if (row.duration_seconds == null) return {};
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    duration_seconds: Number(row.duration_seconds),
    speed: num(row.speed),
    speed_unit: (row.speed_unit as string | null) ?? null,
    incline: num(row.incline),
    distance: num(row.distance),
    distance_unit: (row.distance_unit as string | null) ?? null,
  };
}
