import type { StoredPreviousSets, StoredSet } from "../services/storage";
import { toRows } from "./set-rows";

// Recent finished set counts per exercise and profile key, oldest first.
export type SetCountHistory = Record<string, number[]>;

const MAX_SESSIONS = 8;

// Same key shape as the previous-sets cache, so profiles keep separate targets.
export function setCountKey(exerciseId: string, profileId?: string | null): string {
  return `${exerciseId}_${profileId ?? "default"}`;
}

// One numbered set per row: a bilateral set, or an L/R pair in either layout.
export function countSetGroups(sets: StoredSet[]): number {
  return toRows(sets.filter((s) => !s.warmup)).length;
}

export function recordSetCount(
  history: SetCountHistory,
  key: string,
  sets: StoredSet[],
): SetCountHistory {
  const count = countSetGroups(sets);
  if (count === 0) return history;
  return {
    ...history,
    [key]: [...(history[key] ?? []), count].slice(-MAX_SESSIONS),
  };
}

/**
 * The set number the user usually finishes on: the most common recent count, ties going
 * to the most recent. One-set sessions count as warm-up-only days and are skipped when
 * any session had more. Without recorded counts, the cached last session stands in.
 */
export function targetSetCount(
  history: SetCountHistory,
  previousSets: StoredPreviousSets,
  exerciseId: string,
  profileId?: string | null,
): number | null {
  const key = setCountKey(exerciseId, profileId);
  let counts = history[key] ?? [];
  if (counts.length === 0) {
    const last =
      previousSets[key] ??
      Object.entries(previousSets).find(([k]) => k.startsWith(`${exerciseId}_`))?.[1] ??
      [];
    counts = [
      Math.max(
        countSetGroups(last.filter((set) => set.side == null)),
        countSetGroups(last.filter((set) => set.side != null)),
      ),
    ];
  }
  const largest = Math.max(0, ...counts);
  const real = counts.filter((count) => count > (largest > 1 ? 1 : 0));
  if (real.length === 0) return null;

  const tally = new Map<number, number>();
  for (const count of real) tally.set(count, (tally.get(count) ?? 0) + 1);
  let best: number | null = null;
  let bestTally = 0;
  // Walk newest first so a tie keeps the most recent count.
  for (const count of [...real].reverse()) {
    const n = tally.get(count)!;
    if (n > bestTally) {
      best = count;
      bestTally = n;
    }
  }
  return best;
}
