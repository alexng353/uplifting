import type { StoredPreviousSets, StoredSet } from "../services/storage";

// A null field means the history has no value for it; callers pick their own fallback.
export interface SetSuggestion {
  reps: number | null;
  weight: number | null;
  weightUnit: string | null;
  /** Timed exercises: last time's values for this set. */
  durationSeconds?: number;
  speed?: number;
  speedUnit?: string;
  incline?: number;
}

/**
 * Last session's sets of one mode, split into warmups and working sets. Flagged sessions
 * use their flags. Sessions logged before warmups existed carry no flags, so the same
 * rule applies to them: sets before the first one at 80% of the session's top weight
 * were warmups. Without that, working set 1 suggested last time's warmup weight.
 */
export function splitSession(sets: readonly StoredSet[]): {
  warmups: StoredSet[];
  working: StoredSet[];
} {
  if (sets.some((s) => s.warmup != null)) {
    return { warmups: sets.filter((s) => s.warmup), working: sets.filter((s) => !s.warmup) };
  }
  const top = Math.max(0, ...sets.map((s) => s.weight ?? 0));
  const first = top > 0 ? sets.findIndex((s) => (s.weight ?? 0) >= top * 0.8) : 0;
  return { warmups: sets.slice(0, first), working: sets.slice(first) };
}

/** Which of last session's sets a row should suggest: its nth warmup or nth working set. */
export interface SuggestionSlot {
  warmup: boolean;
  n: number;
}

/**
 * The slot for row `index`. Warmup rows take last session's warmups in order. A working
 * or empty row still offers the next of last session's warmups while no working set has
 * been logged yet and fewer warmups than last time are in; after that it takes its
 * working number.
 */
export function suggestionSlot(
  kinds: readonly ("warmup" | "working")[],
  done: readonly boolean[],
  index: number,
  lastWarmups: number,
): SuggestionSlot {
  let warm = 0;
  let work = 0;
  let workingLogged = false;
  for (let i = 0; i < index; i++) {
    if (kinds[i] === "warmup") warm++;
    else {
      work++;
      if (done[i]) workingLogged = true;
    }
  }
  if (kinds[index] === "warmup") return { warmup: true, n: warm + 1 };
  if (!workingLogged && work === 0 && warm < lastWarmups) return { warmup: true, n: warm + 1 };
  return { warmup: false, n: work + 1 };
}

/** Last session's sets for this exercise and mode: this profile, else another one. */
function sessionSets(
  previousSets: StoredPreviousSets,
  exerciseId: string,
  profileId: string | undefined,
  side?: "L" | "R",
): StoredSet[] {
  const matchingMode = (sets: StoredSet[] = []) =>
    sets.filter((set) => (set.side != null) === (side != null));
  const primaryKey = `${exerciseId}_${profileId ?? "default"}`;
  let sets = matchingMode(previousSets[primaryKey]);
  if (sets.length === 0) {
    for (const [key, history] of Object.entries(previousSets)) {
      if (key.startsWith(`${exerciseId}_`) && key !== primaryKey) {
        sets = matchingMode(history);
        if (sets.length > 0) break;
      }
    }
  }
  if (side) {
    const sideSets = sets.filter((set) => set.side === side);
    if (sideSets.length > 0) sets = sideSets;
  }
  return sets;
}

/** How many warmups last session had in this mode (for suggestionSlot). */
export function lastWarmupCount(
  previousSets: StoredPreviousSets,
  exerciseId: string,
  profileId: string | undefined,
  side?: "L" | "R",
): number {
  return splitSession(sessionSets(previousSets, exerciseId, profileId, side)).warmups.length;
}

export function getPreviousSetSuggestion(
  previousSets: StoredPreviousSets,
  exerciseId: string,
  profileId: string | undefined,
  setNumber: number,
  side?: "L" | "R",
  opts: { warmup?: boolean } = {},
): SetSuggestion {
  // A working row suggests last session's working sets, a warmup row its warmups.
  const split = splitSession(sessionSets(previousSets, exerciseId, profileId, side));
  const sets = opts.warmup ? split.warmups : split.working;

  const targetSet = sets[Math.min(setNumber - 1, sets.length - 1)];
  if (!targetSet) return { reps: null, weight: null, weightUnit: null };
  return {
    reps: targetSet.reps ?? null,
    weight: targetSet.weight ?? null,
    weightUnit: targetSet.weightUnit,
    ...(targetSet.durationSeconds != null
      ? {
          durationSeconds: targetSet.durationSeconds,
          speed: targetSet.speed,
          speedUnit: targetSet.speedUnit,
          incline: targetSet.incline,
        }
      : null),
  };
}
