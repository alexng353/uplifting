import {
	IonBackButton,
	IonAlert,
	IonButton,
	IonButtons,
	IonContent,
	IonDatetime,
	IonHeader,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonLoading,
	IonModal,
	IonPage,
	IonTitle,
	IonToolbar,
	useIonRouter,
} from "@ionic/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	add,
	checkmark,
	close,
	pencil,
	timeOutline,
	trash,
} from "ionicons/icons";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { useSettings } from "../../hooks/useSettings";
import { api } from "../../lib/api";
import type {
	Exercise,
	UserSet,
	WorkoutWithSets,
} from "../../lib/api-openapi-gen/types.gen";
import "../workout/Workout.css";
import "./WorkoutDetail.css";

interface ExerciseGroup {
	exerciseId: string;
	profileId: string | null;
	sets: UserSet[];
}

export default function WorkoutDetail() {
	const { workoutId } = useParams<{ workoutId: string }>();
	const router = useIonRouter();
	const queryClient = useQueryClient();
	const { formatWeight } = useSettings();

	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState("");
	const [editGymLocation, setEditGymLocation] = useState("");
	const [showEndTimePicker, setShowEndTimePicker] = useState(false);
	const [editEndTime, setEditEndTime] = useState<string | null>(null);
	const [showDeleteWorkoutAlert, setShowDeleteWorkoutAlert] = useState(false);

	// Fetch workout with sets
	const {
		data: workout,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["workout", workoutId],
		queryFn: async () => {
			const { data, error } = await api.getWorkout({
				path: { workout_id: workoutId },
			});
			if (error || !data) throw new Error("Failed to fetch workout");
			return data as WorkoutWithSets;
		},
		enabled: !!workoutId,
	});

	// Fetch exercises for names
	const { data: exercises = [] } = useQuery({
		queryKey: ["exercises"],
		queryFn: async () => {
			const { data } = await api.listExercises({ query: { limit: 500 } });
			return (data?.exercises ?? []) as Exercise[];
		},
	});

	const exerciseMap = useMemo(() => {
		return new Map(exercises.map((e) => [e.id, e]));
	}, [exercises]);

	// Group sets by exercise+profile
	const exerciseGroups = useMemo(() => {
		if (!workout?.sets) return [];
		const groups = new Map<string, ExerciseGroup>();

		for (const set of workout.sets) {
			const key = `${set.exercise_id}_${set.profile_id ?? "default"}`;
			if (!groups.has(key)) {
				groups.set(key, {
					exerciseId: set.exercise_id,
					profileId: set.profile_id ?? null,
					sets: [],
				});
			}
			groups.get(key)?.sets.push(set);
		}

		return Array.from(groups.values());
	}, [workout?.sets]);

	// Mutations
	const updateWorkoutMutation = useMutation({
		mutationFn: async (updates: {
			name?: string;
			gym_location?: string;
			end_time?: string;
		}) => {
			const { error } = await api.updateWorkout({
				path: { workout_id: workoutId },
				body: updates,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
			queryClient.invalidateQueries({ queryKey: ["workouts"] });
		},
	});

	const updateSetMutation = useMutation({
		mutationFn: async ({
			setId,
			updates,
		}: {
			setId: string;
			updates: { reps?: number; weight?: string; weight_unit?: string };
		}) => {
			const { error } = await api.updateSet({
				path: { set_id: setId },
				body: updates,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
		},
	});

	const deleteSetMutation = useMutation({
		mutationFn: async (setId: string) => {
			const { error } = await api.deleteSet({
				path: { set_id: setId },
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
		},
	});

	const createSetMutation = useMutation({
		mutationFn: async (body: {
			exercise_id: string;
			profile_id?: string | null;
			reps: number;
			weight: string;
			weight_unit: string;
		}) => {
			const { error } = await api.createSet({
				path: { workout_id: workoutId },
				body,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
		},
	});

	const deleteWorkoutMutation = useMutation({
		mutationFn: async () => {
			const { error } = await api.deleteWorkout({
				path: { workout_id: workoutId },
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workouts"] });
			router.goBack();
		},
	});

	// Handlers
	const handleStartEdit = useCallback(() => {
		if (!workout) return;
		setEditName(workout.name ?? "");
		setEditGymLocation(workout.gym_location ?? "");
		setEditEndTime(workout.end_time ?? null);
		setIsEditing(true);
	}, [workout]);

	const handleSaveEdit = useCallback(async () => {
		await updateWorkoutMutation.mutateAsync({
			name: editName || undefined,
			gym_location: editGymLocation || undefined,
			end_time: editEndTime ?? undefined,
		});
		setIsEditing(false);
	}, [editName, editGymLocation, editEndTime, updateWorkoutMutation]);

	const handleCancelEdit = useCallback(() => {
		setIsEditing(false);
	}, []);

	const handleUpdateSet = useCallback(
		(setId: string, updates: { reps?: number; weight?: number }) => {
			updateSetMutation.mutate({
				setId,
				updates: {
					reps: updates.reps,
					weight: updates.weight?.toString(),
				},
			});
		},
		[updateSetMutation],
	);

	const handleDeleteSet = useCallback(
		(setId: string) => {
			deleteSetMutation.mutate(setId);
		},
		[deleteSetMutation],
	);

	const handleAddSet = useCallback(
		(exerciseId: string, profileId: string | null) => {
			createSetMutation.mutate({
				exercise_id: exerciseId,
				profile_id: profileId,
				reps: 10,
				weight: "20",
				weight_unit: "kg",
			});
		},
		[createSetMutation],
	);

	// Formatting helpers
	const formatDate = (date: string): string => {
		return new Date(date).toLocaleDateString("en-US", {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	};

	const formatTime = (date: string): string => {
		return new Date(date).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const getDuration = (): number => {
		if (!workout?.start_time || !workout?.end_time) return 0;
		const start = new Date(workout.start_time);
		const end = new Date(workout.end_time);
		return Math.round((end.getTime() - start.getTime()) / 60000);
	};

	const getTotalSets = (): number => {
		return workout?.sets?.length ?? 0;
	};

	const getTotalVolume = (): number => {
		if (!workout?.sets) return 0;
		return workout.sets.reduce(
			(sum, s) => sum + s.reps * Number.parseFloat(s.weight),
			0,
		);
	};

	const getExerciseName = (exerciseId: string): string => {
		return exerciseMap.get(exerciseId)?.name ?? "Unknown Exercise";
	};

	if (isLoading) {
		return (
			<IonPage>
				<IonLoading isOpen message="Loading workout..." />
			</IonPage>
		);
	}

	if (error || !workout) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonBackButton defaultHref="/stats" />
						</IonButtons>
						<IonTitle>Workout</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<p>Failed to load workout</p>
				</IonContent>
			</IonPage>
		);
	}

	// Edit mode - swiper view with red banner
	if (isEditing) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar color="danger">
						<IonTitle>Editing Workout</IonTitle>
						<IonButtons slot="start">
							<IonButton onClick={handleCancelEdit}>
								<IonIcon slot="icon-only" icon={close} />
							</IonButton>
						</IonButtons>
						<IonButtons slot="end">
							<IonButton onClick={handleSaveEdit}>
								<IonIcon slot="icon-only" icon={checkmark} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent fullscreen>
					<Swiper
						modules={[Pagination]}
						pagination={{ clickable: true }}
						spaceBetween={0}
						slidesPerView={1}
						className="workout-swiper"
					>
						{/* Workout metadata slide */}
						<SwiperSlide>
							<div className="exercise-slide">
								<div className="exercise-slide-header">
									<h2>Workout Details</h2>
								</div>
								<IonList>
									<IonItem>
										<IonLabel position="stacked">Workout Name</IonLabel>
										<IonInput
											value={editName}
											onIonInput={(e) => setEditName(e.detail.value ?? "")}
											placeholder="e.g., Push Day, Leg Day"
										/>
									</IonItem>
									<IonItem>
										<IonLabel position="stacked">Gym Location</IonLabel>
										<IonInput
											value={editGymLocation}
											onIonInput={(e) =>
												setEditGymLocation(e.detail.value ?? "")
											}
											placeholder="e.g., Downtown Gym"
										/>
									</IonItem>
									<IonItem button onClick={() => setShowEndTimePicker(true)}>
										<IonIcon icon={timeOutline} slot="start" />
										<IonLabel>
											<h2>End Time</h2>
											<p>
												{editEndTime
													? new Date(editEndTime).toLocaleString()
													: "Not set"}
											</p>
										</IonLabel>
									</IonItem>
								</IonList>

								<div className="edit-danger-zone">
									<IonButton
										expand="block"
										color="danger"
										fill="outline"
										onClick={() => setShowDeleteWorkoutAlert(true)}
									>
										<IonIcon slot="start" icon={trash} />
										Delete Workout
									</IonButton>
								</div>
							</div>
						</SwiperSlide>

						{/* Exercise slides */}
						{exerciseGroups.map((group) => (
							<SwiperSlide key={`${group.exerciseId}_${group.profileId}`}>
								<div className="exercise-slide">
									<div className="exercise-slide-header">
										<h2>{getExerciseName(group.exerciseId)}</h2>
										{group.profileId && <p>Profile: {group.profileId}</p>}
									</div>

									<div className="sets-container">
										<div className="set-row header">
											<div>Set</div>
											<div />
											<div>Reps</div>
											<div>Weight</div>
											<div />
										</div>

										<IonList>
											{group.sets.map((set, index) => (
												<div key={set.id} className="set-row">
													<div className="set-number">{index + 1}</div>
													<div />
													<IonInput
														type="number"
														value={set.reps}
														onIonChange={(e) =>
															handleUpdateSet(set.id, {
																reps: Number(e.detail.value),
															})
														}
													/>
													<IonInput
														type="number"
														value={Number.parseFloat(set.weight)}
														onIonChange={(e) =>
															handleUpdateSet(set.id, {
																weight: Number(e.detail.value),
															})
														}
													/>
													<IonButton
														fill="clear"
														color="danger"
														size="small"
														onClick={() => handleDeleteSet(set.id)}
													>
														<IonIcon slot="icon-only" icon={close} />
													</IonButton>
												</div>
											))}
										</IonList>
									</div>

									<div className="add-set-button-container">
										<IonButton
											className="add-set-button"
											onClick={() =>
												handleAddSet(group.exerciseId, group.profileId)
											}
										>
											<IonIcon slot="start" icon={add} />
											Add Set
										</IonButton>
									</div>
								</div>
							</SwiperSlide>
						))}
					</Swiper>

					<IonModal
						isOpen={showEndTimePicker}
						onDidDismiss={() => setShowEndTimePicker(false)}
					>
						<IonHeader>
							<IonToolbar>
								<IonTitle>Select End Time</IonTitle>
								<IonButtons slot="end">
									<IonButton onClick={() => setShowEndTimePicker(false)}>
										Done
									</IonButton>
								</IonButtons>
							</IonToolbar>
						</IonHeader>
						<IonContent>
							<IonDatetime
								value={editEndTime ?? undefined}
								onIonChange={(e) => {
									const val = e.detail.value;
									if (typeof val === "string") {
										setEditEndTime(val);
									}
								}}
								presentation="date-time"
							/>
						</IonContent>
					</IonModal>
					<IonAlert
						isOpen={showDeleteWorkoutAlert}
						onDidDismiss={() => setShowDeleteWorkoutAlert(false)}
						header="Delete Workout"
						message="Are you sure you want to delete this workout? This cannot be undone."
						buttons={[
							{
								text: "Cancel",
								role: "cancel",
							},
							{
								text: "Delete",
								role: "destructive",
								handler: () => {
									setShowDeleteWorkoutAlert(false);
									deleteWorkoutMutation.mutate();
								},
							},
						]}
					/>
				</IonContent>
			</IonPage>
		);
	}

	// View mode - summary list
	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref="/stats" />
					</IonButtons>
					<IonTitle>{workout.name || "Workout"}</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={handleStartEdit}>
							<IonIcon slot="icon-only" icon={pencil} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="workout-detail-content">
					<div className="workout-detail-meta">
						<p className="workout-date">{formatDate(workout.start_time)}</p>
						<p className="workout-time">
							{formatTime(workout.start_time)}
							{workout.end_time && ` – ${formatTime(workout.end_time)}`}
						</p>
						{workout.gym_location && (
							<p className="workout-location">{workout.gym_location}</p>
						)}
					</div>

					<div className="summary-stats">
						<div className="summary-stat">
							<div className="summary-stat-value">{getDuration()}</div>
							<div className="summary-stat-label">Minutes</div>
						</div>
						<div className="summary-stat">
							<div className="summary-stat-value">{exerciseGroups.length}</div>
							<div className="summary-stat-label">Exercises</div>
						</div>
						<div className="summary-stat">
							<div className="summary-stat-value">{getTotalSets()}</div>
							<div className="summary-stat-label">Sets</div>
						</div>
						<div className="summary-stat">
							<div className="summary-stat-value">
								{Math.round(getTotalVolume()).toLocaleString()}
							</div>
							<div className="summary-stat-label">Volume</div>
						</div>
					</div>

					<div className="workout-exercises-list">
						<h3>Exercises</h3>
						{exerciseGroups.map((group) => (
							<div
								key={`${group.exerciseId}_${group.profileId}`}
								className="workout-exercise-item"
							>
								<div className="workout-exercise-name">
									{getExerciseName(group.exerciseId)}
									{group.profileId && (
										<span className="workout-exercise-profile">
											{" "}
											({group.profileId})
										</span>
									)}
								</div>
								<div className="workout-exercise-sets">
									{group.sets.length} sets •{" "}
									{group.sets
										.map(
											(s) =>
												`${s.reps}×${formatWeight(Number.parseFloat(s.weight), s.weight_unit)}`,
										)
										.join(", ")}
								</div>
							</div>
						))}
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
}
