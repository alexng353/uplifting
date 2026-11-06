export interface WeekWorkout {
  id: string;
  name?: string | null;
  startTime: string | Date;
  endTime?: string | Date | null;
  kind: string;
  gymLocation?: string | null;
}

export interface WeekDay {
  date: Date;
  letter: string;
  dayOfMonth: number;
  isToday: boolean;
  isFuture: boolean;
  /** The day's first workout, if any. */
  workout?: WeekWorkout;
  rest: boolean;
}

export interface WeekSummary {
  days: WeekDay[];
  workouts: WeekWorkout[];
  totalMinutes: number;
  /** Days with a workout at a gym, and the gym most of them were at. */
  gymDays: number;
  topGym: string | null;
  /** e.g. "Nov 1 – 7". */
  range: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** This week (Sunday start, like Stats and the streak) in local time. */
export function weekSummary(all: readonly WeekWorkout[], now = new Date()): WeekSummary {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const inWeek = all
    .filter((w) => {
      const d = new Date(w.startTime);
      return d >= start && d < end;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const workouts = inWeek.filter((w) => w.kind === "workout");

  const days: WeekDay[] = LETTERS.map((letter, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const today = sameDay(date, now);
    return {
      date,
      letter,
      dayOfMonth: date.getDate(),
      isToday: today,
      isFuture: !today && date > now,
      workout: workouts.find((w) => sameDay(new Date(w.startTime), date)),
      rest: inWeek.some((w) => w.kind === "rest" && sameDay(new Date(w.startTime), date)),
    };
  });

  let totalMinutes = 0;
  for (const w of workouts) {
    if (w.endTime)
      totalMinutes += Math.round(
        (new Date(w.endTime).getTime() - new Date(w.startTime).getTime()) / 60000,
      );
  }

  const gymCounts = new Map<string, number>();
  let gymDays = 0;
  for (const day of days) {
    const gym = workouts.find(
      (w) => w.gymLocation && sameDay(new Date(w.startTime), day.date),
    )?.gymLocation;
    if (!gym) continue;
    gymDays++;
    gymCounts.set(gym, (gymCounts.get(gym) ?? 0) + 1);
  }
  const topGym = [...gymCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const last = days[6].date;
  // A fixed table: Hermes formats toLocaleDateString months unreliably (it showed Oct for Nov).
  const month = (d: Date) => MONTHS[d.getMonth()];
  const range =
    start.getMonth() === last.getMonth()
      ? `${month(start)} ${start.getDate()} – ${last.getDate()}`
      : `${month(start)} ${start.getDate()} – ${month(last)} ${last.getDate()}`;

  return { days, workouts, totalMinutes, gymDays, topGym, range };
}
