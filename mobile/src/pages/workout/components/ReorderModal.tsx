import type { ItemReorderEventDetail } from "@ionic/react";
import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonItem,
	IonLabel,
	IonList,
	IonReorder,
	IonReorderGroup,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { useCallback } from "react";
import { useWorkout } from "../../../hooks/useWorkout";

interface ReorderModalProps {
	onClose: () => void;
}

export default function ReorderModal({ onClose }: ReorderModalProps) {
	const { workout, reorderExercises } = useWorkout();

	const handleReorder = useCallback(
		(event: CustomEvent<ItemReorderEventDetail>) => {
			if (!workout) return;

			const exercises = [...workout.exercises];
			const [removed] = exercises.splice(event.detail.from, 1);
			exercises.splice(event.detail.to, 0, removed);

			reorderExercises(exercises.map((e) => e.exerciseId));
			event.detail.complete();
		},
		[workout, reorderExercises],
	);

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Reorder Exercises</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onClose}>Done</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				<IonList>
					<IonReorderGroup disabled={false} onIonItemReorder={handleReorder}>
						{workout?.exercises.map((exercise) => (
							<IonItem key={exercise.exerciseId}>
								<IonLabel>
									<h2>{exercise.exerciseName}</h2>
									<p>{exercise.sets.length} sets</p>
								</IonLabel>
								<IonReorder slot="end" />
							</IonItem>
						))}
					</IonReorderGroup>
				</IonList>
			</IonContent>
		</>
	);
}
