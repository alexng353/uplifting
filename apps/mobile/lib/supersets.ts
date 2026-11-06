import type { StoredSet, StoredWorkoutExercise } from "../services/storage";
import { rowSets, toRows } from "./set-rows";

/**
 * Superset auto-detection. Two exercises are a superset when he alternates between them
 * (a set of A, then B, then A, in log order) while both still have sets to go. No setup:
 * the grouping appears on its own and goes away when one of them is finished. A pair he
 * marked "not a superset" never groups again in that workout.
 */

export type SupersetExercise = Pick<StoredWorkoutExercise, "exerciseId" | "sets">;

const done = (s: StoredSet) => s.reps != null && s.reps > 0 && s.weight != null;

/** Log time of each finished row: the latest doneAt of its sets. */
function rowLog(exercise: SupersetExercise): { done: number; open: number; times: number[] } {
  let doneRows = 0;
  let open = 0;
  const times: number[] = [];
  for (const row of toRows(exercise.sets)) {
    const sets = rowSets(row);
    if (sets.every(done)) {
      doneRows++;
      const t = Math.max(...sets.map((s) => (s.doneAt ? Date.parse(s.doneAt) : NaN)));
      if (Number.isFinite(t)) times.push(t);
    } else {
      open++;
    }
  }
  return { done: doneRows, open, times };
}

export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/**
 * Superset groups (exercise ids in workout order), each with two or more exercises.
 * `finished(id, doneRows)` says an exercise is complete (e.g. reached its usual set
 * count); an exercise with no open rows is finished too.
 */
export function detectSupersets(
  exercises: readonly SupersetExercise[],
  opts: {
    dismissed?: readonly string[];
    finished?: (exerciseId: string, doneRows: number) => boolean;
  } = {},
): string[][] {
  const logs = new Map(exercises.map((e) => [e.exerciseId, rowLog(e)]));
  const active = new Set(
    exercises
      .filter((e) => {
        const l = logs.get(e.exerciseId)!;
        return l.done > 0 && l.open > 0 && !opts.finished?.(e.exerciseId, l.done);
      })
      .map((e) => e.exerciseId),
  );
  // One stream of finished sets across the workout, oldest first.
  const events = exercises
    .flatMap((e) => logs.get(e.exerciseId)!.times.map((t) => ({ t, id: e.exerciseId })))
    .sort((a, b) => a.t - b.t)
    .map((e) => e.id);
  const dismissed = new Set(opts.dismissed ?? []);
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    while (parent.get(x) !== x) x = parent.get(x)!;
    return x;
  };
  for (const id of active) parent.set(id, id);
  for (let i = 2; i < events.length; i++) {
    const [a, b, c] = [events[i - 2], events[i - 1], events[i]];
    if (a !== c || a === b) continue;
    if (!active.has(a) || !active.has(b) || dismissed.has(pairKey(a, b))) continue;
    parent.set(find(a), find(b));
  }
  const groups = new Map<string, string[]>();
  for (const e of exercises) {
    if (!active.has(e.exerciseId)) continue;
    const root = find(e.exerciseId);
    groups.set(root, [...(groups.get(root) ?? []), e.exerciseId]);
  }
  return [...groups.values()].filter((g) => g.length >= 2);
}

/**
 * Where the superset goes next after a logged set: the member with the fewest finished
 * rows, earliest in the group after the one just logged. Null when the round is done
 * (everyone has caught up), which is when the normal rest applies.
 */
export function nextInRound(
  group: readonly string[],
  exercises: readonly SupersetExercise[],
  justLogged: string,
): string | null {
  const doneOf = (id: string) => {
    const e = exercises.find((x) => x.exerciseId === id);
    return e ? rowLog(e).done : 0;
  };
  const mine = doneOf(justLogged);
  const start = group.indexOf(justLogged);
  const order = [...group.slice(start + 1), ...group.slice(0, Math.max(start, 0))];
  return order.find((id) => doneOf(id) < mine) ?? null;
}

/** "Tibialis Raise 2/3 · Reverse Lunge 1/3" for the Lock Screen. */
export function supersetProgress(
  group: readonly string[],
  exercises: readonly (SupersetExercise & { exerciseName: string })[],
  target: (exerciseId: string) => number | null,
  shortName: (name: string) => string = (n) => n,
): string {
  return group
    .map((id) => {
      const e = exercises.find((x) => x.exerciseId === id);
      if (!e) return null;
      const l = rowLog(e);
      const of = target(id) ?? l.done + l.open;
      return `${shortName(e.exerciseName)} ${l.done}/${of}`;
    })
    .filter(Boolean)
    .join(" · ");
}
