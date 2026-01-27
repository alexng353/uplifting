import "./WeekStreak.css";

export type DayStatus = "none" | "rest" | "workout";

export interface WorkoutEntry {
	date: Date | string;
	kind: "workout" | "rest";
}

export interface WeekStreakProps {
	/**
	 * Status for each day of the week, starting from Sunday (index 0)
	 * If not provided, defaults to "none" for all days
	 */
	days?: DayStatus[];

	/**
	 * Preferred: Pass workout entries with date and kind
	 */
	entries?: WorkoutEntry[];

	/**
	 * Alternative: Pass workout dates and the component will calculate status
	 * Dates should be Date objects or ISO strings
	 * @deprecated Use `entries` instead for workout/rest distinction
	 */
	workoutDates?: (Date | string)[];

	/**
	 * Rest days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
	 * Used when workoutDates is provided
	 * @deprecated Use `entries` instead
	 */
	restDays?: number[];

	/**
	 * Which week to display (defaults to current week)
	 */
	weekOf?: Date;

	/**
	 * Show day labels (S M T W T F S)
	 */
	showLabels?: boolean;

	/**
	 * Size variant
	 */
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
	// Build a map of date -> kind (workout takes precedence over rest if both exist)
	const dateStatusMap = new Map<string, DayStatus>();

	for (const entry of entries) {
		const date =
			typeof entry.date === "string" ? new Date(entry.date) : entry.date;
		const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
		const currentStatus = dateStatusMap.get(dateKey);
		// Normalize kind - default to "workout" if missing/invalid
		const kind: DayStatus =
			entry.kind === "rest"
				? "rest"
				: entry.kind === "workout"
					? "workout"
					: "workout";

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

function calculateDayStatuses(
	weekDates: Date[],
	workoutDates: (Date | string)[],
	restDays: number[],
): DayStatus[] {
	const workoutDateSet = new Set(
		workoutDates.map((d) => {
			const date = typeof d === "string" ? new Date(d) : d;
			return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
		}),
	);

	return weekDates.map((date, index) => {
		const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

		if (workoutDateSet.has(dateKey)) {
			return "workout";
		}

		if (restDays.includes(index)) {
			return "rest";
		}

		return "none";
	});
}

export default function WeekStreak({
	days,
	entries,
	workoutDates,
	restDays = [],
	weekOf = new Date(),
	showLabels = true,
	size = "medium",
}: WeekStreakProps) {
	const weekDates = getWeekDates(weekOf);
	const today = new Date();

	// Calculate statuses from props (priority: days > entries > workoutDates)
	let statuses: DayStatus[];
	if (days) {
		statuses = days;
	} else if (entries) {
		statuses = calculateDayStatusesFromEntries(weekDates, entries);
	} else if (workoutDates) {
		statuses = calculateDayStatuses(weekDates, workoutDates, restDays);
	} else {
		statuses = Array(7).fill("none") as DayStatus[];
	}

	return (
		<div className={`week-streak week-streak--${size}`}>
			{statuses.map((status, index) => {
				const date = weekDates[index];
				const isToday = isSameDay(date, today);
				const isFuture = date > today;

				return (
					<div key={date.toISOString()} className="week-streak__day">
						{showLabels && (
							<span className="week-streak__label">{DAY_LABELS[index]}</span>
						)}
						<div
							className={`week-streak__dot week-streak__dot--${status}${isToday ? " week-streak__dot--today" : ""}${isFuture ? " week-streak__dot--future" : ""}`}
						/>
					</div>
				);
			})}
		</div>
	);
}
