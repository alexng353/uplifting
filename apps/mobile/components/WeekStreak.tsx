import { View, Text } from "react-native";

export type DayStatus = "none" | "rest" | "workout";

export interface WorkoutEntry {
  date: Date | string;
  kind: "workout" | "rest";
}

export interface WeekStreakProps {
  /** Status for each day of the week, starting from Sunday (index 0) */
  days?: DayStatus[];

  /** Preferred: Pass workout entries with date and kind */
  entries?: WorkoutEntry[];

  /** Which week to display (defaults to current week) */
  weekOf?: Date;

  /** Show day labels (S M T W T F S) */
  showLabels?: boolean;

  /** Size variant */
  size?: "small" | "medium" | "large";
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getWeekDates(weekOf: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(weekOf);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function calculateDayStatusesFromEntries(
  weekDates: Date[],
  entries: WorkoutEntry[],
): DayStatus[] {
  const dateStatusMap = new Map<string, DayStatus>();

  for (const entry of entries) {
    const date =
      typeof entry.date === "string" ? new Date(entry.date) : entry.date;
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const currentStatus = dateStatusMap.get(dateKey);
    const kind: DayStatus =
      entry.kind === "rest" ? "rest" : "workout";

    // Workout takes precedence over rest
    if (kind === "workout" || currentStatus !== "workout") {
      dateStatusMap.set(dateKey, kind);
    }
  }

  return weekDates.map((date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return dateStatusMap.get(dateKey) ?? "none";
  });
}

const DOT_SIZES = {
  small: "h-3 w-3",
  medium: "h-5 w-5",
  large: "h-8 w-8",
} as const;

const LABEL_SIZES = {
  small: "text-[8px]",
  medium: "text-[10px]",
  large: "text-xs",
} as const;

const STATUS_COLORS = {
  none: "bg-zinc-700",
  rest: "bg-zinc-400",
  workout: "bg-blue-500",
} as const;

export default function WeekStreak({
  days,
  entries,
  weekOf = new Date(),
  showLabels = true,
  size = "medium",
}: WeekStreakProps) {
  const weekDates = getWeekDates(weekOf);
  const today = new Date();

  let statuses: DayStatus[];
  if (days) {
    statuses = days;
  } else if (entries) {
    statuses = calculateDayStatusesFromEntries(weekDates, entries);
  } else {
    statuses = Array(7).fill("none") as DayStatus[];
  }

  return (
    <View className="flex-row justify-between gap-2">
      {statuses.map((status, index) => {
        const date = weekDates[index];
        const isToday = isSameDay(date, today);
        const isFuture = date > today;

        return (
          <View
            key={date.toISOString()}
            className="items-center gap-1"
          >
            {showLabels && (
              <Text
                className={`font-semibold uppercase text-zinc-400 ${LABEL_SIZES[size]}`}
              >
                {DAY_LABELS[index]}
              </Text>
            )}
            <View
              className={`rounded-full ${DOT_SIZES[size]} ${STATUS_COLORS[status]} ${isFuture ? "opacity-40" : ""}`}
              style={
                isToday
                  ? {
                      borderWidth: 2,
                      borderColor: "#3b82f6",
                      // Create ring effect by adding padding
                    }
                  : undefined
              }
            />
          </View>
        );
      })}
    </View>
  );
}
