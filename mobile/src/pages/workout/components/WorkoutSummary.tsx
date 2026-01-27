import {
	IonButton,
	IonContent,
	IonHeader,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { useCallback, useState } from "react";
import type { StoredWorkout } from "../../../services/local-storage";

interface WorkoutSummaryProps {
	workout: StoredWorkout;
	onSave: (name?: string, gymLocation?: string) => void;
	onCancel: () => void;
}

export default function WorkoutSummary({
	workout,
	onSave,
	onCancel,
}: WorkoutSummaryProps) {
	const [name, setName] = useState(workout.name ?? "");
	const [gymLocation, setGymLocation] = useState(workout.gymLocation ?? "");

	const handleSave = useCallback(() => {
		onSave(name || undefined, gymLocation || undefined);
	}, [name, gymLocation, onSave]);

	// Calculate stats
	const totalSets = workout.exercises.reduce(
		(sum, ex) => sum + ex.sets.length,
		0,
	);
	const totalVolume = workout.exercises.reduce(
		(sum, ex) =>
			sum +
			ex.sets.reduce((s, set) => s + (set.reps ?? 0) * (set.weight ?? 0), 0),
		0,
	);
	const duration = Math.round(
		(Date.now() - new Date(workout.startTime).getTime()) / 60000,
	);

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Workout Summary</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<div className="summary-content">
					<IonList>
						<IonItem>
							<IonLabel position="stacked">Workout Name (optional)</IonLabel>
							<IonInput
								value={name}
								onIonInput={(e) => setName(e.detail.value ?? "")}
								placeholder="e.g., Push Day, Leg Day"
							/>
						</IonItem>
						<IonItem>
							<IonLabel position="stacked">Gym Location (optional)</IonLabel>
							<IonInput
								value={gymLocation}
								onIonInput={(e) => setGymLocation(e.detail.value ?? "")}
								placeholder="e.g., Downtown Gym"
							/>
						</IonItem>
					</IonList>

					<div className="summary-stats">
						<div className="summary-stat">
							<div className="summary-stat-value">{duration}</div>
							<div className="summary-stat-label">Minutes</div>
						</div>
						<div className="summary-stat">
							<div className="summary-stat-value">
								{workout.exercises.length}
							</div>
							<div className="summary-stat-label">Exercises</div>
						</div>
						<div className="summary-stat">
							<div className="summary-stat-value">{totalSets}</div>
							<div className="summary-stat-label">Sets</div>
						</div>
						<div className="summary-stat">
							<div className="summary-stat-value">
								{Math.round(totalVolume).toLocaleString()}
							</div>
							<div className="summary-stat-label">Volume</div>
						</div>
					</div>

					<div className="summary-exercises">
						<h3>Exercises</h3>
						{workout.exercises.map((exercise) => (
							<div key={exercise.exerciseId} className="summary-exercise">
								<div className="summary-exercise-name">
									{exercise.exerciseName}
								</div>
								<div className="summary-exercise-sets">
									{exercise.sets.length} sets •{" "}
									{exercise.sets
										.map((s) => `${s.reps ?? 0}×${s.weight ?? 0}`)
										.join(", ")}
								</div>
							</div>
						))}
					</div>

					<div className="summary-buttons">
						<IonButton expand="block" fill="outline" onClick={onCancel}>
							Continue Workout
						</IonButton>
						<IonButton expand="block" onClick={handleSave}>
							Save Workout
						</IonButton>
					</div>
				</div>
			</IonContent>
		</>
	);
}
