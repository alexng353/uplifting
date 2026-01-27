import {
	IonActionSheet,
	IonAlert,
	IonButton,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonSearchbar,
	IonSpinner,
} from "@ionic/react";
import { add, star, starOutline } from "ionicons/icons";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	useAllExerciseProfiles,
	useCreateExerciseProfile,
	useExerciseProfiles,
} from "../../../hooks/useExerciseProfiles";
import { useExercises } from "../../../hooks/useExercises";
import {
	useFavouriteExercises,
	useToggleFavourite,
} from "../../../hooks/useFavouriteExercises";
import { useWorkout } from "../../../hooks/useWorkout";
import type { Exercise } from "../../../lib/api-openapi-gen";

interface AddExerciseSlideProps {
	onExerciseAdded: () => void;
}

export default function AddExerciseSlide({
	onExerciseAdded,
}: AddExerciseSlideProps) {
	const { addExercise } = useWorkout();
	const [searchText, setSearchText] = useState("");
	const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
		null,
	);
	const [showProfileSheet, setShowProfileSheet] = useState(false);
	const [showNewProfileAlert, setShowNewProfileAlert] = useState(false);
	const [newProfileAlertKey, setNewProfileAlertKey] = useState(0);
	const transitioningToAlertRef = useRef(false);

	const { data: exercises, isLoading } = useExercises(searchText);
	const { data: allProfiles } = useAllExerciseProfiles();
	const { data: favourites } = useFavouriteExercises();
	const toggleFavourite = useToggleFavourite();
	const { data: selectedProfiles = [] } = useExerciseProfiles(
		selectedExercise?.id ?? "",
	);
	const createProfile = useCreateExerciseProfile(selectedExercise?.id ?? "");

	const handleToggleFavourite = useCallback(
		(e: React.MouseEvent, exerciseId: string) => {
			e.stopPropagation();
			const isFavourite = favourites?.has(exerciseId) ?? false;
			toggleFavourite.mutate({ exerciseId, isFavourite });
		},
		[favourites, toggleFavourite],
	);

	const getProfilesLabel = useCallback(
		(exerciseId: string) => {
			const profiles = allProfiles?.get(exerciseId);
			if (!profiles || profiles.length === 0) return null;
			if (profiles.length === 1) return profiles[0].name;
			if (profiles.length === 2)
				return `${profiles[0].name}, ${profiles[1].name}`;
			return `${profiles[0].name}, +${profiles.length - 1}`;
		},
		[allProfiles],
	);

	const handleSelectExercise = useCallback((exercise: Exercise) => {
		setSelectedExercise(exercise);
		setShowProfileSheet(true);
	}, []);

	const handleAddWithProfile = useCallback(
		(profileId?: string, profileName?: string) => {
			if (!selectedExercise) return;
			const displayName = profileName
				? `${selectedExercise.name} (${profileName})`
				: selectedExercise.name;
			addExercise(selectedExercise.id, displayName, profileId);
			setShowProfileSheet(false);
			setSelectedExercise(null);
			setSearchText(""); // Clear search when exercise is added
			onExerciseAdded();
		},
		[selectedExercise, addExercise, onExerciseAdded],
	);

	const handleCreateProfile = useCallback(
		async (name: string) => {
			if (!name.trim()) return;
			const profile = await createProfile.mutateAsync(name.trim());
			handleAddWithProfile(profile.id, profile.name);
		},
		[createProfile, handleAddWithProfile],
	);

	const profileActions = useMemo(
		() => [
			{
				text: "Default (no profile)",
				handler: () => handleAddWithProfile(),
			},
			...selectedProfiles.map((p) => ({
				text: p.name,
				handler: () => handleAddWithProfile(p.id, p.name),
			})),
			{
				text: "Create new profile...",
				handler: () => {
					transitioningToAlertRef.current = true;
					setNewProfileAlertKey((key) => key + 1);
					setShowProfileSheet(false);
					setShowNewProfileAlert(true);
				},
			},
			{
				text: "Cancel",
				role: "cancel" as const,
				handler: () => {
					setSelectedExercise(null);
				},
			},
		],
		[selectedProfiles, handleAddWithProfile],
	);

	// Sort exercises: favourites first, then alphabetically
	const sortedExercises = useMemo(() => {
		if (!exercises) return [];
		return [...exercises].sort((a, b) => {
			const aFav = favourites?.has(a.id) ?? false;
			const bFav = favourites?.has(b.id) ?? false;
			if (aFav && !bFav) return -1;
			if (!aFav && bFav) return 1;
			return a.name.localeCompare(b.name);
		});
	}, [exercises, favourites]);

	// Group exercises by first letter (with favourites section)
	const { groupedExercises, sortedLetters } = useMemo(() => {
		const grouped: Record<string, Exercise[]> = {};
		const favs: Exercise[] = [];

		for (const exercise of sortedExercises) {
			if (favourites?.has(exercise.id)) {
				favs.push(exercise);
			} else {
				const letter = exercise.name[0].toUpperCase();
				if (!grouped[letter]) {
					grouped[letter] = [];
				}
				grouped[letter].push(exercise);
			}
		}

		const letters = Object.keys(grouped).sort();
		if (favs.length > 0) {
			grouped["★"] = favs;
			letters.unshift("★");
		}

		return { groupedExercises: grouped, sortedLetters: letters };
	}, [sortedExercises, favourites]);

	return (
		<div className="add-exercise-slide">
			<h2>Add Exercise</h2>

			<IonSearchbar
				value={searchText}
				onIonInput={(e) => setSearchText(e.detail.value ?? "")}
				placeholder="Search exercises..."
				debounce={300}
			/>

			<div className="exercise-list-container">
				{isLoading ? (
					<div className="exercise-list-loading">
						<IonSpinner />
						<p>Loading exercises...</p>
					</div>
				) : sortedExercises.length === 0 ? (
					<div className="exercise-list-empty">
						<p>No exercises found</p>
					</div>
				) : (
					sortedLetters.map((letter) => (
						<div key={letter}>
							<h3 className="ion-padding-start">
								{letter === "★" ? "★ Favourites" : letter}
							</h3>
							<IonList>
								{groupedExercises[letter].map((exercise) => {
									const profilesLabel = getProfilesLabel(exercise.id);
									const isFavourite = favourites?.has(exercise.id) ?? false;
									return (
										<IonItem
											key={exercise.id}
											button
											onClick={() => handleSelectExercise(exercise)}
										>
											<IonButton
												slot="start"
												fill="clear"
												className="favourite-button"
												onClick={(e) => handleToggleFavourite(e, exercise.id)}
											>
												<IonIcon
													slot="icon-only"
													icon={isFavourite ? star : starOutline}
													color={isFavourite ? "warning" : "medium"}
												/>
											</IonButton>
											<IonLabel>
												<h3>{exercise.name}</h3>
												<div className="exercise-meta">
													<span>{exercise.exercise_type}</span>
													{profilesLabel && (
														<span className="profiles-label">
															({profilesLabel})
														</span>
													)}
												</div>
											</IonLabel>
											<IonButton
												slot="end"
												fill="clear"
												onClick={(e) => {
													e.stopPropagation();
													handleSelectExercise(exercise);
												}}
											>
												<IonIcon slot="icon-only" icon={add} />
											</IonButton>
										</IonItem>
									);
								})}
							</IonList>
						</div>
					))
				)}
			</div>

			<IonActionSheet
				isOpen={showProfileSheet}
				onDidDismiss={() => {
					setShowProfileSheet(false);
					// Only clear selectedExercise if we're not transitioning to the new profile alert
					if (transitioningToAlertRef.current) {
						transitioningToAlertRef.current = false;
					} else {
						setSelectedExercise(null);
					}
				}}
				header={`Add ${selectedExercise?.name ?? "Exercise"}`}
				subHeader="Select a profile or use default"
				buttons={profileActions}
			/>

			<IonAlert
				key={newProfileAlertKey}
				isOpen={showNewProfileAlert}
				onDidDismiss={() => {
					setShowNewProfileAlert(false);
					setSelectedExercise(null);
				}}
				header="Create New Profile"
				message={`Create a profile for ${selectedExercise?.name ?? "this exercise"}`}
				inputs={[
					{
						name: "profileName",
						type: "text",
						placeholder: "e.g., Wide Grip, Incline, Close Grip",
					},
				]}
				buttons={[
					{
						text: "Cancel",
						role: "cancel",
					},
					{
						text: "Create & Add",
						handler: (data) => {
							if (data.profileName) {
								handleCreateProfile(data.profileName);
							}
						},
					},
				]}
			/>
		</div>
	);
}
