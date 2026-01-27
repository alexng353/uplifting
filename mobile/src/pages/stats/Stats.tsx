import {
	IonBadge,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { useCallback, useMemo } from "react";
import { WeekStreak, type WorkoutEntry } from "../../components/WeekStreak";
import "./Stats.css";
import { useWithPending } from "../../hooks/useWithPending";
import { useWorkouts } from "../../hooks/useWorkouts";
import { getPendingWorkout } from "../../services/local-storage";

// Unified workout type for display
interface DisplayWorkout {
	id: string;
	name: string | null | undefined;
	startTime: string;
	endTime: string | null | undefined;
	gymLocation?: string | null;
	kind: "workout" | "rest";
}

export default function Stats() {
	const workoutsQuery = useWorkouts(1, 10);

	const {
		items: workoutItems,
		isLoading,
		refresh,
	} = useWithPending({
		query: workoutsQuery,
		getPending: getPendingWorkout,
		transformLocal: (local): DisplayWorkout => ({
			id: local.id,
			name: local.name,
			startTime: local.startTime,
			endTime: undefined, // Pending workouts don't have end time yet
			gymLocation: local.gymLocation,
			// Default to "workout" for old data without kind
			kind: local.kind ?? "workout",
		}),
		transformRemote: (remote): DisplayWorkout => ({
			id: remote.id,
			name: remote.name,
			startTime: remote.start_time,
			endTime: remote.end_time,
			gymLocation: remote.gym_location,
			// Default to "workout" for old data without kind
			kind: remote.kind ?? "workout",
		}),
		isDuplicate: (pending, synced) => pending.id === synced.id,
	});

	const weekStats = useMemo(() => {
		const now = new Date();
		const dayOfWeek = now.getDay();
		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - dayOfWeek);
		startOfWeek.setHours(0, 0, 0, 0);

		const thisWeekItems = workoutItems.filter((item) => {
			const workoutDate = new Date(item.data.startTime);
			return workoutDate >= startOfWeek;
		});

		// Only count actual workouts, not rest days
		const actualWorkouts = thisWeekItems.filter(
			(item) => item.data.kind === "workout",
		);

		let totalMinutes = 0;
		for (const item of actualWorkouts) {
			const start = new Date(item.data.startTime);
			// For pending workouts without end time, use now
			const end = item.data.endTime ? new Date(item.data.endTime) : new Date();
			totalMinutes += Math.round((end.getTime() - start.getTime()) / 60000);
		}

		// Collect entries for the week streak (both workouts and rest days)
		const entries: WorkoutEntry[] = thisWeekItems.map((item) => ({
			date: item.data.startTime,
			kind: item.data.kind,
		}));

		return {
			totalWorkouts: actualWorkouts.length,
			totalSets: 0,
			totalVolume: 0,
			totalMinutes,
			entries,
		};
	}, [workoutItems]);

	const handleRefresh = useCallback(
		async (event: CustomEvent) => {
			await refresh();
			event.detail.complete();
		},
		[refresh],
	);

	const formatDate = (date: string): string => {
		return new Date(date).toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	};

	const formatDuration = (
		start: string,
		end: string | null | undefined,
	): string => {
		if (!end) return "In progress";
		const startDate = new Date(start);
		const endDate = new Date(end);
		const mins = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
		return `${mins} min`;
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Stats</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">Stats</IonTitle>
					</IonToolbar>
				</IonHeader>

				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent />
				</IonRefresher>

				<div className="stats-content">
					<IonCard>
						<IonCardHeader>
							<IonCardTitle>This Week</IonCardTitle>
						</IonCardHeader>
						<IonCardContent>
							<WeekStreak entries={weekStats.entries} size="medium" />
							<div className="week-stats">
								<div className="stat-item">
									<span className="stat-value">{weekStats.totalWorkouts}</span>
									<span className="stat-label">Workouts</span>
								</div>
								<div className="stat-item">
									<span className="stat-value">{weekStats.totalMinutes}</span>
									<span className="stat-label">Minutes</span>
								</div>
							</div>
						</IonCardContent>
					</IonCard>

					<h3 className="section-title">Recent Workouts</h3>

					{isLoading ? (
						<p className="ion-text-center">Loading...</p>
					) : workoutItems.length === 0 ? (
						<div className="empty-state">
							<p>No workouts yet</p>
							<p>Complete your first workout to see stats</p>
						</div>
					) : (
						<IonList>
							{workoutItems.map((item) =>
								item.isPending ? (
									<IonItem key={item.data.id} className="pending-workout">
										<IonLabel>
											<h2>{item.data.name || "Workout"}</h2>
											<p>{formatDate(item.data.startTime)}</p>
										</IonLabel>
										<IonBadge slot="end" color="warning">
											Syncing...
										</IonBadge>
									</IonItem>
								) : (
									<IonItem
										key={item.data.id}
										button
										detail
										routerLink={`/stats/workout/${item.data.id}`}
									>
										<IonLabel>
											<h2>{item.data.name || "Workout"}</h2>
											<p>{formatDate(item.data.startTime)}</p>
										</IonLabel>
										<span slot="end" className="workout-duration">
											{formatDuration(item.data.startTime, item.data.endTime)}
										</span>
									</IonItem>
								),
							)}
						</IonList>
					)}
				</div>
			</IonContent>
		</IonPage>
	);
}
