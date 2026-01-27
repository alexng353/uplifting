import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	generateId,
	getCurrentWorkout,
	getPendingWorkout,
	getSettings,
	type StoredSet,
	type StoredWorkout,
	type StoredWorkoutExercise,
	setCurrentWorkout,
	setPendingWorkout,
	updatePreviousSets,
} from "../services/local-storage";

interface WorkoutContextValue {
	workout: StoredWorkout | null;
	isActive: boolean;
	startWorkout: () => Promise<void>;
	logRestDay: () => Promise<StoredWorkout>;
	addExercise: (
		exerciseId: string,
		exerciseName: string,
		profileId?: string,
	) => Promise<void>;
	removeExercise: (exerciseId: string) => Promise<void>;
	reorderExercises: (newOrder: string[]) => Promise<void>;
	addSet: (
		exerciseId: string,
		weightUnit: string,
		reps?: number,
		weight?: number,
		side?: "L" | "R",
	) => Promise<void>;
	addUnilateralPair: (
		exerciseId: string,
		weightUnit: string,
		reps?: number,
		weight?: number,
	) => Promise<void>;
	updateSet: (
		exerciseId: string,
		setId: string,
		updates: Partial<StoredSet>,
	) => Promise<void>;
	removeSet: (exerciseId: string, setId: string) => Promise<void>;
	removeLastSet: (exerciseId: string) => Promise<void>;
	removeLastUnilateralPair: (exerciseId: string) => Promise<void>;
	toggleUnilateral: (exerciseId: string) => Promise<void>;
	finishWorkout: (
		name?: string,
		gymLocation?: string,
	) => Promise<StoredWorkout>;
	cancelWorkout: () => Promise<void>;
	hasPendingWorkout: boolean;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
	const [workout, setWorkout] = useState<StoredWorkout | null>(null);
	const [hasPendingWorkout, setHasPendingWorkout] = useState(false);

	// Load current workout on mount
	useEffect(() => {
		const loadWorkout = async () => {
			const [current, pending] = await Promise.all([
				getCurrentWorkout(),
				getPendingWorkout(),
			]);

			setHasPendingWorkout(pending !== null);

			if (current) {
				// Check if workout is too old (> 24 hours)
				const startTime = new Date(current.startTime);
				const now = new Date();
				const hoursDiff =
					(now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

				if (hoursDiff > 24) {
					// Auto-cap the workout - move to pending for sync
					const cappedWorkout = { ...current };
					await setPendingWorkout(cappedWorkout);
					await setCurrentWorkout(null);
					setHasPendingWorkout(true);
				} else {
					setWorkout(current);
				}
			}
		};
		loadWorkout();
	}, []);

	const saveWorkout = useCallback(async (w: StoredWorkout | null) => {
		setWorkout(w);
		await setCurrentWorkout(w);
	}, []);

	const startWorkout = useCallback(async () => {
		const settings = await getSettings();
		const newWorkout: StoredWorkout = {
			id: generateId(),
			startTime: new Date().toISOString(),
			exercises: [],
			privacy: settings.defaultPrivacy,
			kind: "workout",
		};
		await saveWorkout(newWorkout);
	}, [saveWorkout]);

	const logRestDay = useCallback(async (): Promise<StoredWorkout> => {
		const settings = await getSettings();
		const now = new Date().toISOString();
		const restDay: StoredWorkout = {
			id: generateId(),
			startTime: now,
			exercises: [],
			privacy: settings.defaultPrivacy,
			kind: "rest",
			name: "Rest Day",
		};

		// Rest days go directly to pending (no active workout state)
		await setPendingWorkout(restDay);
		setHasPendingWorkout(true);

		return restDay;
	}, []);

	const addExercise = useCallback(
		async (exerciseId: string, exerciseName: string, profileId?: string) => {
			if (!workout) return;

			const settings = await getSettings();
			const unit = settings.displayUnit ?? "kg";

			// Auto-add first empty set
			const firstSet: StoredSet = {
				id: generateId(),
				weightUnit: unit,
				createdAt: new Date().toISOString(),
			};

			const newExercise: StoredWorkoutExercise = {
				exerciseId,
				exerciseName,
				profileId,
				sets: [firstSet],
			};

			const updated = {
				...workout,
				exercises: [...workout.exercises, newExercise],
			};
			await saveWorkout(updated);
		},
		[workout, saveWorkout],
	);

	const removeExercise = useCallback(
		async (exerciseId: string) => {
			if (!workout) return;

			const updated = {
				...workout,
				exercises: workout.exercises.filter((e) => e.exerciseId !== exerciseId),
			};
			await saveWorkout(updated);
		},
		[workout, saveWorkout],
	);

	const reorderExercises = useCallback(
		async (newOrder: string[]) => {
			if (!workout) return;

			const exerciseMap = new Map(
				workout.exercises.map((e) => [e.exerciseId, e]),
			);
			const reordered = newOrder
				.map((id) => exerciseMap.get(id))
				.filter((e): e is StoredWorkoutExercise => e !== undefined);

			const updated = { ...workout, exercises: reordered };
			await saveWorkout(updated);
		},
		[workout, saveWorkout],
	);

	const addSet = useCallback(
		async (
			exerciseId: string,
			weightUnit: string,
			reps?: number,
			weight?: number,
			side?: "L" | "R",
		) => {
			if (!workout) return;

			const newSet: StoredSet = {
				id: generateId(),
				reps,
				weight,
				weightUnit,
				createdAt: new Date().toISOString(),
				side,
			};

			const updated = {
				...workout,
				exercises: workout.exercises.map((e) =>
					e.exerciseId === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e,
				),
			};
			await saveWorkout(updated);
		},
		[workout, saveWorkout],
	);

	const addUnilateralPair = useCallback(
		async (
			exerciseId: string,
			weightUnit: string,
			reps?: number,
			weight?: number,
		) => {
			if (!workout) return;

			const rightSet: StoredSet = {
				id: generateId(),
				reps,
				weight,
				weightUnit,
				createdAt: new Date().toISOString(),
				side: "R",
			};

			const leftSet: StoredSet = {
				id: generateId(),
				reps,
				weight,
				weightUnit,
				createdAt: new Date().toISOString(),
				side: "L",
			};

			const updated = {
				...workout,
				exercises: workout.exercises.map((e) =>
					e.exerciseId === exerciseId
						? { ...e, sets: [...e.sets, rightSet, leftSet] }
						: e,
				),
			};
			await saveWorkout(updated);
		},
		[workout, saveWorkout],
	);

	const toggleUnilateral = useCallback(
		async (exerciseId: string) => {
			if (!workout) return;

			const updated = {
				...workout,
				exercises: workout.exercises.map((e) => {
					if (e.exerciseId !== exerciseId) {
						return e;
					}

					const isCurrentlyUnilateral = e.isUnilateral ?? false;

					if (!isCurrentlyUnilateral) {
						const expandedSets = e.sets.flatMap((set) => {
							if (set.side) {
								return [set];
							}

							const rightSet: StoredSet = { ...set, side: "R" };
							const leftSet: StoredSet = {
								...set,
								id: generateId(),
								side: "L",
							};
							return [rightSet, leftSet];
						});

						return { ...e, isUnilateral: true, sets: expandedSets };
					}

					const rightSets = e.sets.filter(
						(set) => set.side === "R" || !set.side,
					);
					const leftSets = e.sets.filter((set) => set.side === "L");
					const maxLen = Math.max(rightSets.length, leftSets.length);
					const mergedSets: StoredSet[] = [];

					for (let i = 0; i < maxLen; i += 1) {
						const rightSet = rightSets[i];
						const leftSet = leftSets[i];

						if (!rightSet && !leftSet) continue;

						const baseSet = rightSet ?? leftSet;
						if (!baseSet) continue;

						mergedSets.push({
							id: rightSet?.id ?? leftSet?.id ?? generateId(),
							reps: rightSet?.reps ?? leftSet?.reps,
							weight: rightSet?.weight ?? leftSet?.weight,
							weightUnit:
								rightSet?.weightUnit ??
								leftSet?.weightUnit ??
								baseSet.weightUnit,
							createdAt:
								rightSet?.createdAt ?? leftSet?.createdAt ?? baseSet.createdAt,
						});
					}

					return { ...e, isUnilateral: false, sets: mergedSets };
				}),
			};
			await saveWorkout(updated);
		},
		[workout, saveWorkout],
	);

	const updateSet = useCallback(
		async (exerciseId: string, setId: string, updates: Partial<StoredSet>) => {
			if (!workout) return;

			const updated = {
				...workout,
				exercises: workout.exercises.map((e) =>
					e.exerciseId === exerciseId
						? {
								...e,
								sets: e.sets.map((s) =>
									s.id === setId ? { ...s, ...updates } : s,
								),
							}
						: e,
				),
			};
			await saveWorkout(updated);
		},
		[workout, saveWorkout],
	);

	const removeSet = useCallback(
		async (exerciseId: string, setId: string) => {
			if (!workout) return;

			const updated = {
				...workout,
				exercises: workout.exercises.map((e) =>
					e.exerciseId === exerciseId
						? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
						: e,
				),
			};
			await saveWorkout(updated);
		},
		[workout, saveWorkout],
	);

	const removeLastSet = useCallback(
		async (exerciseId: string) => {
			if (!workout) return;

			const updated = {
				...workout,
				exercises: workout.exercises.map((e) =>
					e.exerciseId === exerciseId ? { ...e, sets: e.sets.slice(0, -1) } : e,
				),
			};
			await saveWorkout(updated);
		},
		[workout, saveWorkout],
	);

	const removeLastUnilateralPair = useCallback(
		async (exerciseId: string) => {
			if (!workout) return;

			const exercise = workout.exercises.find(
				(e) => e.exerciseId === exerciseId,
			);
			if (!exercise) return;

			// Find the last R and L sets
			const rightSets = exercise.sets.filter((s) => s.side === "R");
			const leftSets = exercise.sets.filter((s) => s.side === "L");
			const lastRight = rightSets[rightSets.length - 1];
			const lastLeft = leftSets[leftSets.length - 1];

			const idsToRemove = new Set<string>();
			if (lastRight) idsToRemove.add(lastRight.id);
			if (lastLeft) idsToRemove.add(lastLeft.id);

			const updated = {
				...workout,
				exercises: workout.exercises.map((e) =>
					e.exerciseId === exerciseId
						? { ...e, sets: e.sets.filter((s) => !idsToRemove.has(s.id)) }
						: e,
				),
			};
			await saveWorkout(updated);
		},
		[workout, saveWorkout],
	);

	const finishWorkout = useCallback(
		async (name?: string, gymLocation?: string): Promise<StoredWorkout> => {
			if (!workout) throw new Error("No active workout");

			const finishedWorkout: StoredWorkout = {
				...workout,
				name,
				gymLocation,
			};

			// Save previous sets for each exercise
			for (const exercise of finishedWorkout.exercises) {
				await updatePreviousSets(
					exercise.exerciseId,
					exercise.profileId ?? null,
					exercise.sets,
				);
			}

			// Mark as pending sync
			await setPendingWorkout(finishedWorkout);
			await setCurrentWorkout(null);
			setWorkout(null);
			setHasPendingWorkout(true);

			return finishedWorkout;
		},
		[workout],
	);

	const cancelWorkout = useCallback(async () => {
		await setCurrentWorkout(null);
		setWorkout(null);
	}, []);

	return (
		<WorkoutContext.Provider
			value={{
				workout,
				isActive: workout !== null,
				startWorkout,
				logRestDay,
				addExercise,
				removeExercise,
				reorderExercises,
				addSet,
				addUnilateralPair,
				updateSet,
				removeSet,
				removeLastSet,
				removeLastUnilateralPair,
				toggleUnilateral,
				finishWorkout,
				cancelWorkout,
				hasPendingWorkout,
			}}
		>
			{children}
		</WorkoutContext.Provider>
	);
}

export function useWorkout() {
	const context = useContext(WorkoutContext);
	if (!context) {
		throw new Error("useWorkout must be used within a WorkoutProvider");
	}
	return context;
}
