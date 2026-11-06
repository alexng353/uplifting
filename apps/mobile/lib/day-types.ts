import type { ExerciseSequenceEntry } from "../services/storage";

/**
 * Day types (Upper, Lower, ...): each has an ordered exercise list. Starting a workout
 * picks one (default: the next in rotation), and the day's list plus that day's history
 * lead the exercise suggestions, so upper and lower history stop bleeding together.
 * Stored on the phone only.
 */
export interface DayType {
  id: string;
  name: string;
  exerciseIds: string[];
}

const LOWER = /\b(leg|legs|lower|squat|glute|glutes|quad|quads|hamstring|calf|calves)\b/i;
const UPPER = /\b(upper|push|pull|chest|back|arm|arms|shoulder|shoulders|bicep|tricep)\b/i;

/** "Leg day" -> lower, "Upper" -> upper, anything else -> null. */
export function titleKind(title: string | undefined | null): "upper" | "lower" | null {
  if (!title) return null;
  if (LOWER.test(title)) return "lower";
  if (UPPER.test(title)) return "upper";
  return null;
}

/** Past sessions of a day: titles naming it ("Upper") or of the same kind ("Leg day"). */
export function sessionsForDay(
  day: Pick<DayType, "name">,
  sequences: readonly ExerciseSequenceEntry[],
): ExerciseSequenceEntry[] {
  const kind = titleKind(day.name);
  const name = day.name.trim().toLowerCase();
  return sequences.filter(
    (s) =>
      !!s.title &&
      (s.title.trim().toLowerCase() === name || (kind != null && titleKind(s.title) === kind)),
  );
}

/**
 * A day's list from its recent sessions: exercises done in at least half of them, in
 * their usual order (average position).
 */
export function listFromSessions(sessions: readonly ExerciseSequenceEntry[]): string[] {
  if (sessions.length === 0) return [];
  const seen = new Map<string, { n: number; pos: number }>();
  for (const s of sessions) {
    s.exerciseIds.forEach((id, i) => {
      const e = seen.get(id) ?? { n: 0, pos: 0 };
      e.n += 1;
      e.pos += i / Math.max(1, s.exerciseIds.length - 1);
      seen.set(id, e);
    });
  }
  const min = Math.max(1, Math.ceil(sessions.length / 2));
  return [...seen]
    .filter(([, e]) => e.n >= min)
    .sort((a, b) => a[1].pos / a[1].n - b[1].pos / b[1].n)
    .map(([id]) => id);
}

/** Upper and Lower, filled from his last few sessions of each. */
export function seedDayTypes(sequences: readonly ExerciseSequenceEntry[], recent = 4): DayType[] {
  return [
    { id: "upper", name: "Upper" },
    { id: "lower", name: "Lower" },
  ].map((d) => ({
    ...d,
    exerciseIds: listFromSessions(sessionsForDay(d, sequences).slice(0, recent)),
  }));
}

/** The next day in rotation: the one after his most recent session's day. */
export function nextDayType(
  days: readonly DayType[],
  sequences: readonly ExerciseSequenceEntry[],
): DayType | null {
  if (days.length === 0) return null;
  for (const s of sequences) {
    const i = days.findIndex((d) => sessionsForDay(d, [s]).length > 0);
    if (i >= 0) return days[(i + 1) % days.length];
  }
  return days[0];
}

/**
 * Suggestions inside a day: the day's list in order (skipping what's already in the
 * workout), then what usually follows in that day's history, then all history.
 */
export function rankForDay(
  day: DayType,
  sequences: readonly ExerciseSequenceEntry[],
  currentIds: readonly string[],
  rank: (seqs: ExerciseSequenceEntry[], current: string[], max: number) => string[],
  max = 5,
): string[] {
  const out: string[] = [];
  const add = (id: string) => {
    if (out.length < max && !currentIds.includes(id) && !out.includes(id)) out.push(id);
  };
  day.exerciseIds.forEach(add);
  rank(sessionsForDay(day, sequences), [...currentIds], max).forEach(add);
  rank([...sequences], [...currentIds], max).forEach(add);
  return out;
}

/** The next exercise of the day's list not yet in the workout, for one-tap add. */
export function nextListed(
  day: DayType | null | undefined,
  currentIds: readonly string[],
): string | null {
  return day?.exerciseIds.find((id) => !currentIds.includes(id)) ?? null;
}

const LOWER_MUSCLE =
  /quad|vastus|rectus femoris|glute|hamstring|biceps femoris|semi|gastrocnemius|soleus|calf|adductor|abductor|tibialis/i;

/**
 * A label for a workout with no day picked: once two exercises have logged sets, "Leg
 * day" when most of them mainly work the legs, else "Upper". Null before that.
 */
export function inferDayTitle(
  loggedExerciseIds: readonly string[],
  primaryMuscles: (exerciseId: string) => readonly string[],
): string | null {
  if (loggedExerciseIds.length < 2) return null;
  const lower = loggedExerciseIds.filter((id) => {
    const m = primaryMuscles(id);
    return m.length > 0 && m.filter((x) => LOWER_MUSCLE.test(x)).length * 2 >= m.length;
  }).length;
  return lower * 2 > loggedExerciseIds.length ? "Leg day" : "Upper";
}
