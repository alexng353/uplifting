import {
	IonAlert,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonModal,
	IonPage,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { bed, checkmark, close, construct, reorderFour } from "ionicons/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "./Workout.css";
import { useMe } from "../../hooks/useMe";
import { useSync } from "../../hooks/useSync";
import { useWorkout } from "../../hooks/useWorkout";
import {
	getWorkoutLastSlide,
	setWorkoutLastSlide,
} from "../../services/local-storage";
import AddExerciseSlide from "./components/AddExerciseSlide";
import AdminExerciseModal from "./components/AdminExerciseModal";
import ExerciseSlide from "./components/ExerciseSlide";
import ReorderModal from "./components/ReorderModal";
import WorkoutSummary from "./components/WorkoutSummary";

function WorkoutContent() {
	const {
		workout,
		isActive,
		startWorkout,
		logRestDay,
		finishWorkout,
		cancelWorkout,
	} = useWorkout();
	const { forceSync } = useSync();
	const { data: me } = useMe();
	const [showSummary, setShowSummary] = useState(false);
	const [showReorder, setShowReorder] = useState(false);
	const [showCancelAlert, setShowCancelAlert] = useState(false);
	const [showAdminExercise, setShowAdminExercise] = useState(false);
	const swiperRef = useRef<SwiperType | null>(null);
	const [isSwiperReady, setIsSwiperReady] = useState(false);
	const [lastSlideIndex, setLastSlideIndex] = useState<number | null>(null);
	const hasRestoredSlideRef = useRef(false);
	const hasUserInteractedRef = useRef(false);
	const workoutId = workout?.id;
	const exerciseCount = workout?.exercises.length ?? 0;
	const isAdmin = me?.is_admin ?? false;

	const adminExerciseButton = isAdmin ? (
		<IonButton onClick={() => setShowAdminExercise(true)}>
			<IonIcon slot="icon-only" icon={construct} />
		</IonButton>
	) : null;

	const adminExerciseModal = (
		<AdminExerciseModal
			isOpen={showAdminExercise}
			isAdmin={isAdmin}
			onDidDismiss={() => setShowAdminExercise(false)}
		/>
	);

	const handleFinish = useCallback(() => {
		setShowSummary(true);
	}, []);

	const handleSave = useCallback(
		async (name?: string, gymLocation?: string) => {
			await finishWorkout(name, gymLocation);
			setShowSummary(false);
			// Attempt to sync immediately after saving
			forceSync();
		},
		[finishWorkout, forceSync],
	);

	const handleCancel = useCallback(() => {
		setShowSummary(false);
	}, []);

	const handleExerciseAdded = useCallback(() => {
		// Slide to the newly added exercise
		// Note: workout.exercises.length is the OLD count (before add)
		// so the new exercise will be at index = length
		if (swiperRef.current && workout) {
			swiperRef.current.slideTo(workout.exercises.length);
		}
	}, [workout]);

	const handleLogRestDay = useCallback(async () => {
		await logRestDay();
		// Attempt to sync immediately
		forceSync();
	}, [logRestDay, forceSync]);

	const handleSlideChange = useCallback(
		(swiper: SwiperType) => {
			if (!workoutId) return;
			const nextIndex = swiper.activeIndex;

			if (!hasRestoredSlideRef.current) {
				hasUserInteractedRef.current = true;
				hasRestoredSlideRef.current = true;
			}

			setLastSlideIndex(nextIndex);
			void setWorkoutLastSlide(workoutId, nextIndex);
		},
		[workoutId],
	);

	useEffect(() => {
		let isCancelled = false;
		hasRestoredSlideRef.current = false;
		hasUserInteractedRef.current = false;
		setLastSlideIndex(null);
		setIsSwiperReady(false);

		if (!workoutId) {
			return () => {
				isCancelled = true;
			};
		}

		const loadLastSlide = async () => {
			const stored = await getWorkoutLastSlide();
			if (isCancelled || hasUserInteractedRef.current) return;

			const initialIndex =
				stored?.workoutId === workoutId ? stored.slideIndex : 0;
			setLastSlideIndex(initialIndex);
		};

		void loadLastSlide();

		return () => {
			isCancelled = true;
		};
	}, [workoutId]);

	useEffect(() => {
		if (!workoutId || lastSlideIndex === null || !isSwiperReady) {
			return;
		}
		if (!swiperRef.current || hasRestoredSlideRef.current) {
			return;
		}
		if (hasUserInteractedRef.current) {
			return;
		}

		const maxIndex = exerciseCount;
		const clampedIndex = Math.max(0, Math.min(lastSlideIndex, maxIndex));

		hasRestoredSlideRef.current = true;

		if (swiperRef.current.activeIndex !== clampedIndex) {
			swiperRef.current.slideTo(clampedIndex, 0);
		}

		if (clampedIndex !== lastSlideIndex) {
			setLastSlideIndex(clampedIndex);
		}
		void setWorkoutLastSlide(workoutId, clampedIndex);
	}, [workoutId, lastSlideIndex, exerciseCount, isSwiperReady]);

	useEffect(() => {
		if (!workoutId || lastSlideIndex === null || !isSwiperReady) {
			return;
		}
		if (!swiperRef.current || !hasRestoredSlideRef.current) {
			return;
		}

		const maxIndex = exerciseCount;
		if (lastSlideIndex <= maxIndex) {
			return;
		}

		swiperRef.current.slideTo(maxIndex, 0);
		setLastSlideIndex(maxIndex);
		void setWorkoutLastSlide(workoutId, maxIndex);
	}, [workoutId, lastSlideIndex, exerciseCount, isSwiperReady]);

	if (!isActive) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Workout</IonTitle>
						{isAdmin && (
							<IonButtons slot="end">{adminExerciseButton}</IonButtons>
						)}
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding" fullscreen>
					<div className="start-workout-container">
						<h2>Ready to train?</h2>
						<p>Start a new workout session to begin logging your exercises.</p>
						<IonButton expand="block" onClick={startWorkout}>
							Start Workout
						</IonButton>
						<IonButton
							expand="block"
							fill="outline"
							color="medium"
							onClick={handleLogRestDay}
							className="rest-day-button"
						>
							<IonIcon slot="start" icon={bed} />
							Log Rest Day
						</IonButton>
					</div>
				</IonContent>
				{adminExerciseModal}
			</IonPage>
		);
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Workout</IonTitle>
					<IonButtons slot="start">
						<IonButton onClick={() => setShowReorder(true)}>
							<IonIcon slot="icon-only" icon={reorderFour} />
						</IonButton>
					</IonButtons>
					<IonButtons slot="end">
						{adminExerciseButton}
						<IonButton onClick={() => setShowCancelAlert(true)} color="danger">
							<IonIcon slot="icon-only" icon={close} />
						</IonButton>
						<IonButton onClick={handleFinish} color="success">
							<IonIcon slot="icon-only" icon={checkmark} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<Swiper
					onSwiper={(swiper) => {
						swiperRef.current = swiper;
						setIsSwiperReady(true);
					}}
					onSlideChange={handleSlideChange}
					modules={[Pagination]}
					pagination={{ clickable: true }}
					spaceBetween={0}
					slidesPerView={1}
					className="workout-swiper"
				>
					{workout?.exercises.map((exercise) => (
						<SwiperSlide key={exercise.exerciseId}>
							<ExerciseSlide exercise={exercise} />
						</SwiperSlide>
					))}
					<SwiperSlide>
						<AddExerciseSlide onExerciseAdded={handleExerciseAdded} />
					</SwiperSlide>
				</Swiper>
			</IonContent>

			{workout && (
				<IonModal isOpen={showSummary} onDidDismiss={handleCancel}>
					<WorkoutSummary
						workout={workout}
						onSave={handleSave}
						onCancel={handleCancel}
					/>
				</IonModal>
			)}

			<IonModal isOpen={showReorder} onDidDismiss={() => setShowReorder(false)}>
				<ReorderModal onClose={() => setShowReorder(false)} />
			</IonModal>

			{showCancelAlert && (
				<IonAlert
					isOpen={showCancelAlert}
					onDidDismiss={() => setShowCancelAlert(false)}
					header="Cancel Workout"
					message="Are you sure you want to cancel this workout? All progress will be lost."
					buttons={[
						{
							text: "No",
							role: "cancel",
							cssClass: "workout-cancel-alert-button-no",
						},
						{
							text: "Cancel",
							role: "destructive",
							cssClass: "workout-cancel-alert-button-cancel",
							handler: () => {
								cancelWorkout();
							},
						},
					]}
				/>
			)}
			{adminExerciseModal}
		</IonPage>
	);
}

export default function Workout() {
	return <WorkoutContent />;
}
