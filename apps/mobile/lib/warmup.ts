/**
 * Automatic warmup sets. Within an exercise and mode (bilateral or per side), a logged
 * set is a warmup until the line is reached, and it is reached by the first set that is
 * both at 80% of last session's working weight and at 90% of the heaviest set logged in
 * this session. The second test catches heavy ramp sets (100, 170, then 200s: 170 is a
 * warmup), and since it only compares with sets actually logged today, a lighter day
 * (all 170s after 200 last time) stays working. Once a working set is logged, nothing
 * below it is a warmup, so back-off sets stay working. A set's own flag (long-press on
 * its number) always wins. No automatic classification for bodyweight or timed
 * exercises, or without a previous session.
 */

export const WARMUP_SHARE = 0.8;
/** Share of today's top set a set before it must reach to count as working. */
export const RAMP_SHARE = 0.9;

export interface WarmupRow {
  /** "bi" or "side": rows only compare with history of their own mode. */
  mode: "bi" | "side";
  /** Heaviest weight in the row, in the same unit as lastWorking. */
  weight: number | null;
  done: boolean;
  /** The user's own call for this row (long-press); undefined = automatic. */
  flag?: boolean;
}

export type WarmupKind = "warmup" | "working";

export function classifyRows(
  rows: readonly WarmupRow[],
  lastWorking: Partial<Record<"bi" | "side", number | null>>,
  eligible: boolean,
): WarmupKind[] {
  const reached: Record<"bi" | "side", boolean> = { bi: false, side: false };
  const top: Record<"bi" | "side", number> = { bi: 0, side: 0 };
  for (const row of rows) {
    if (row.done && row.flag !== true) top[row.mode] = Math.max(top[row.mode], row.weight ?? 0);
  }
  // Warmups come before the work: once any working set is logged, nothing below it is a
  // warmup, in any mode and even with a long-press flag (a back-off set stays working).
  let workingLogged = false;
  const working = (row: WarmupRow): WarmupKind => {
    if (row.done) workingLogged = true;
    return "working";
  };
  return rows.map((row) => {
    if (workingLogged) return "working";
    if (row.flag === true) return "warmup";
    if (row.flag === false) {
      reached[row.mode] = true;
      return working(row);
    }
    const last = lastWorking[row.mode];
    if (!eligible || last == null || !(last > 0) || reached[row.mode] || !row.done) {
      return working(row);
    }
    const w = row.weight ?? 0;
    if (w >= last * WARMUP_SHARE && w >= top[row.mode] * RAMP_SHARE) {
      reached[row.mode] = true;
      return working(row);
    }
    return "warmup";
  });
}

/** Last session's working weight: the heaviest set of that mode that wasn't a warmup. */
export function lastWorkingWeight(
  previous: readonly { weight?: number | null; side?: string | null; warmup?: boolean }[],
  mode: "bi" | "side",
): number | null {
  const ws = previous
    .filter((s) => (s.side != null) === (mode === "side") && !s.warmup)
    .map((s) => s.weight ?? 0)
    .filter((w) => w > 0);
  return ws.length ? Math.max(...ws) : null;
}

/**
 * The row where working sets begin, if this edit just moved it there automatically: the
 * first logged working row, after logged warmups, that wasn't a logged working row
 * before (typing 120 passes through 1 and 12, which are still warmups). For the
 * "Working sets from here" toast.
 */
export function newWorkingStart(
  before: readonly WarmupKind[],
  after: readonly WarmupKind[],
  rowsDoneBefore: readonly boolean[],
  rowsDoneAfter: readonly boolean[],
): number | null {
  const first = after.findIndex((k, i) => k === "working" && rowsDoneAfter[i]);
  if (first <= 0) return null;
  if (!after.slice(0, first).some((k, i) => k === "warmup" && rowsDoneAfter[i])) return null;
  const wasWorking = before[first] === "working" && rowsDoneBefore[first];
  return wasWorking ? null : first;
}
