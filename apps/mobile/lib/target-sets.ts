import type { StoredPreviousSets, StoredSet } from "../services/storage";

// Recent finished set counts per exercise id, oldest first.
export type SetCountHistory = Record<string, number[]>;

const MAX_SESSIONS = 8;

// A unilateral set is one R/L pair, so count the longer side.
export function countSetGroups(sets: StoredSet[]): number {
  if (!sets.some((set) => set.side != null)) return sets.length;
  const right = sets.filter((set) => set.side === "R").length;
  const left = sets.filter((set) => set.side === "L").length;
  return Math.max(right, left);
}

export function recordSetCount(
  history: SetCountHistory,
  exerciseId: string,
  sets: StoredSet[],
): SetCountHistory {
  const count = countSetGroups(sets);
  if (count === 0) return history;
  return {
    ...history,
    [exerciseId]: [...(history[exerciseId] ?? []), count].slice(-MAX_SESSIONS),
  };
}

/**
 * The set number the user usually finishes on: the most common recent count, ties going
 * to the most recent. Sessions under half the largest recent count are treated as
 * warm-up-only days. Without recorded counts, the cached last session stands in.
 */
export function targetSetCount(
  history: SetCountHistory,
  previousSets: StoredPreviousSets,
  exerciseId: string,
): number | null {
  let counts = history[exerciseId] ?? [];
  if (counts.length === 0) {
    const last = Object.entries(previousSets)
      .filter(([key]) => key.startsWith(`${exerciseId}_`))
      .flatMap(([, sets]) => [
        countSetGroups(sets.filter((set) => set.side == null)),
        countSetGroups(sets.filter((set) => set.side != null)),
      ]);
    counts = [Math.max(0, ...last)];
  }
  const largest = Math.max(0, ...counts);
  const real = counts.filter((count) => count > 0 && count * 2 >= largest);
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
