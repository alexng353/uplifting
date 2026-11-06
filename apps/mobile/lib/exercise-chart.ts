/**
 * Chart data for Stats → exercise history.
 *
 * The history API gives each set an optional `side` (R/L) but no layout, so the chart can
 * tell bilateral sets from per-side (unilateral or split) sets, not unilateral from split.
 * Plotting both on one line mixes a two-handed peak with a one-handed one, so the screen
 * shows one mode at a time.
 */

export type ChartMode = "bi" | "side";

export type HistorySet = {
  reps: number;
  weight: number | string;
  weight_unit?: string | null;
  side?: string | null;
};

export type HistoryEntry<S extends HistorySet = HistorySet> = {
  workout_id: string;
  date: string;
  sets: S[];
};

export function setMode(s: HistorySet): ChartMode {
  return s.side ? "side" : "bi";
}

/** Modes present in the history, bilateral first. */
export function availableModes(history: readonly HistoryEntry[]): ChartMode[] {
  const seen = new Set<ChartMode>();
  for (const e of history) for (const s of e.sets) seen.add(setMode(s));
  return (["bi", "side"] as const).filter((m) => seen.has(m));
}

/**
 * The mode he used most recently: the majority mode of the newest session (ties go to the
 * mode of that session's last set).
 */
export function defaultMode(history: readonly HistoryEntry[]): ChartMode {
  let newest: HistoryEntry | undefined;
  for (const e of history) {
    if (e.sets.length === 0) continue;
    if (!newest || Date.parse(e.date) > Date.parse(newest.date)) newest = e;
  }
  if (!newest) return "bi";
  const side = newest.sets.filter((s) => s.side).length;
  const bi = newest.sets.length - side;
  if (side !== bi) return side > bi ? "side" : "bi";
  return setMode(newest.sets[newest.sets.length - 1]);
}

/** The history with only the sets of one mode; sessions with none of them are dropped. */
export function filterByMode<S extends HistorySet>(
  history: readonly HistoryEntry<S>[],
  mode: ChartMode,
): HistoryEntry<S>[] {
  return history
    .map((e) => ({ ...e, sets: e.sets.filter((s) => setMode(s) === mode) }))
    .filter((e) => e.sets.length > 0);
}

/** Peak weight per session, oldest first, x by date (ms). */
export function peakSeries(
  history: readonly HistoryEntry[],
  toWeight: (s: HistorySet) => number,
): { dateMs: number; weight: number }[] {
  return history
    .filter((e) => e.sets.length > 0)
    .map((e) => ({
      dateMs: Date.parse(e.date),
      weight: Math.max(...e.sets.map(toWeight)),
    }))
    .filter((p) => Number.isFinite(p.dateMs) && Number.isFinite(p.weight))
    .sort((a, b) => a.dateMs - b.dateMs);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * X-axis label for a timestamp. Months for long ranges, day and month for short ones.
 * A fixed month table, because Hermes' toLocaleDateString isn't reliable.
 */
export function xTickLabel(ms: number, spanMs: number): string {
  const d = new Date(ms);
  const DAY = 86_400_000;
  if (spanMs > 400 * DAY) return `${MONTHS[d.getMonth()]} ’${String(d.getFullYear()).slice(2)}`;
  if (spanMs > 120 * DAY) return MONTHS[d.getMonth()];
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
