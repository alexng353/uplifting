import {
	IonBadge,
	IonButton,
	IonButtons,
	IonChip,
	IonContent,
	IonHeader,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonModal,
	IonNote,
	IonSearchbar,
	IonSelect,
	IonSelectOption,
	IonSpinner,
	IonText,
	IonTextarea,
	IonTitle,
	IonToast,
	IonToolbar,
} from "@ionic/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { add, close, closeCircle } from "ionicons/icons";
import { useCallback, useMemo, useState } from "react";
import {
	findMuscleGroup,
	MuscleChart,
	type MuscleStatusMap,
} from "../../../components/MuscleChart";
import { api } from "../../../lib/api";
import type { ExerciseType, Muscle } from "../../../lib/api-openapi-gen";
import "./AdminExerciseModal.css";

interface AdminExerciseModalProps {
	isOpen: boolean;
	onDidDismiss: () => void;
	isAdmin: boolean;
}

const FALLBACK_EXERCISE_TYPES: ExerciseType[] = [
	"Dumbbell",
	"Barbell",
	"Bodyweight",
	"Machine",
	"Kettlebell",
	"ResistanceBand",
	"Cable",
	"MedicineBall",
	"Plyometric",
	"PlateLoadedMachine",
];

const formatExerciseType = (type: ExerciseType) =>
	type.replace(/([a-z])([A-Z])/g, "$1 $2");

const normalizeValue = (value: string) => value.trim().toLowerCase();

export default function AdminExerciseModal({
	isOpen,
	onDidDismiss,
	isAdmin,
}: AdminExerciseModalProps) {
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [exerciseType, setExerciseType] = useState<ExerciseType | "">("");
	const [bodyPartInput, setBodyPartInput] = useState("");
	const [bodyParts, setBodyParts] = useState<string[]>([]);
	const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
	const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
	const [muscleSearch, setMuscleSearch] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [toastMessage, setToastMessage] = useState("");
	const [showToast, setShowToast] = useState(false);

	const { data: exerciseTypesData, isLoading: isTypesLoading } = useQuery({
		queryKey: ["exerciseTypes"],
		queryFn: async () => {
			const { data, error } = await api.listTypes();
			if (error || !data) {
				throw new Error("Failed to load exercise types");
			}
			return data;
		},
		enabled: isOpen && isAdmin,
	});

	const { data: musclesData, isLoading: isMusclesLoading } = useQuery({
		queryKey: ["muscles"],
		queryFn: async () => {
			const { data, error } = await api.getAll();
			if (error || !data) {
				throw new Error("Failed to load muscles");
			}
			return data;
		},
		enabled: isOpen && isAdmin,
	});

	const { data: muscleGroupsData } = useQuery({
		queryKey: ["muscleGroups"],
		queryFn: async () => {
			const { data, error } = await api.getGroups();
			if (error || !data) {
				throw new Error("Failed to load muscle groups");
			}
			return data;
		},
		enabled: isOpen && isAdmin,
	});

	const exerciseTypes = exerciseTypesData?.length
		? exerciseTypesData
		: FALLBACK_EXERCISE_TYPES;
	const muscles = musclesData ?? [];

	const suggestedBodyParts = useMemo(() => {
		if (!muscleGroupsData) return [];
		const combined = [
			...muscleGroupsData.major_groups,
			...muscleGroupsData.minor_groups,
		]
			.map((part) => part.trim())
			.filter(Boolean);
		return Array.from(new Set(combined)).sort((a, b) => a.localeCompare(b));
	}, [muscleGroupsData]);

	const primarySet = useMemo(
		() => new Set(primaryMuscles.map(normalizeValue)),
		[primaryMuscles],
	);
	const secondarySet = useMemo(
		() => new Set(secondaryMuscles.map(normalizeValue)),
		[secondaryMuscles],
	);

	const muscleStatusMap = useMemo<MuscleStatusMap>(() => {
		const statusMap: MuscleStatusMap = {};
		for (const muscle of primaryMuscles) {
			const groupId = findMuscleGroup(muscle);
			if (groupId) statusMap[groupId] = "primary";
		}
		for (const muscle of secondaryMuscles) {
			const groupId = findMuscleGroup(muscle);
			if (groupId && statusMap[groupId] !== "primary") {
				statusMap[groupId] = "secondary";
			}
		}
		return statusMap;
	}, [primaryMuscles, secondaryMuscles]);

	const filteredMuscles = useMemo(() => {
		const query = normalizeValue(muscleSearch);
		const filtered = muscles.filter((muscle) => {
			if (!query) return true;
			return (
				normalizeValue(muscle.name).includes(query) ||
				normalizeValue(muscle.minor_group).includes(query) ||
				(muscle.scientific_name &&
					normalizeValue(muscle.scientific_name).includes(query))
			);
		});
		return filtered.sort((a, b) => a.name.localeCompare(b.name));
	}, [muscleSearch, muscles]);

	const createExercise = useMutation({
		mutationFn: async () => {
			const trimmedName = name.trim();
			const trimmedDescription = description.trim();
			const cleanedBodyParts = bodyParts
				.map((part) => part.trim())
				.filter(Boolean);

			const { data, error } = await api.create({
				body: {
					name: trimmedName,
					description: trimmedDescription,
					exercise_type: exerciseType as ExerciseType,
					body_parts: cleanedBodyParts,
					primary_muscles: primaryMuscles,
					secondary_muscles: secondaryMuscles,
				},
			});

			if (error || !data) {
				throw new Error("Failed to create exercise");
			}
			return data;
		},
		onMutate: () => {
			setErrorMessage("");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exercises"] });
			setToastMessage("Exercise created successfully");
			setShowToast(true);
			handleReset();
		},
		onError: () => {
			setErrorMessage(
				"Unable to create exercise. Please double-check the fields.",
			);
		},
	});

	const handleReset = useCallback(() => {
		setName("");
		setDescription("");
		setExerciseType("");
		setBodyPartInput("");
		setBodyParts([]);
		setPrimaryMuscles([]);
		setSecondaryMuscles([]);
		setMuscleSearch("");
		setErrorMessage("");
	}, []);

	const handleAddBodyPart = useCallback((value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return;
		setBodyParts((prev) => {
			const exists = prev.some(
				(part) => normalizeValue(part) === normalizeValue(trimmed),
			);
			return exists ? prev : [...prev, trimmed];
		});
		setBodyPartInput("");
	}, []);

	const handleRemoveBodyPart = useCallback((partToRemove: string) => {
		setBodyParts((prev) => prev.filter((part) => part !== partToRemove));
	}, []);

	const togglePrimaryMuscle = useCallback((muscle: Muscle) => {
		setPrimaryMuscles((prev) => {
			const exists = prev.includes(muscle.name);
			if (exists) return prev.filter((item) => item !== muscle.name);
			return [...prev, muscle.name];
		});
		setSecondaryMuscles((prev) => prev.filter((item) => item !== muscle.name));
	}, []);

	const toggleSecondaryMuscle = useCallback((muscle: Muscle) => {
		setSecondaryMuscles((prev) => {
			const exists = prev.includes(muscle.name);
			if (exists) return prev.filter((item) => item !== muscle.name);
			return [...prev, muscle.name];
		});
		setPrimaryMuscles((prev) => prev.filter((item) => item !== muscle.name));
	}, []);

	const isFormValid =
		name.trim().length > 0 &&
		description.trim().length > 0 &&
		exerciseType !== "" &&
		bodyParts.length > 0 &&
		primaryMuscles.length > 0;

	const handleSubmit = useCallback(() => {
		if (!isFormValid || createExercise.isPending) return;
		createExercise.mutate();
	}, [createExercise, isFormValid]);

	const handleDismiss = useCallback(() => {
		setErrorMessage("");
		onDidDismiss();
	}, [onDidDismiss]);

	return (
		<IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Admin: Create Exercise</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={handleDismiss}>
							<IonIcon slot="icon-only" icon={close} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="admin-exercise-content">
				{!isAdmin ? (
					<div className="admin-exercise-locked">
						<IonText color="danger">
							<h2>Admin access required</h2>
						</IonText>
						<IonText color="medium">
							This screen is only available to admin accounts.
						</IonText>
					</div>
				) : (
					<>
						<IonList inset>
							<IonItem>
								<IonLabel position="stacked">Exercise name</IonLabel>
								<IonInput
									value={name}
									placeholder="e.g., Incline Dumbbell Press"
									onIonInput={(e) => setName(e.detail.value ?? "")}
								/>
							</IonItem>
							<IonItem>
								<IonLabel position="stacked">Description</IonLabel>
								<IonTextarea
									value={description}
									placeholder="Describe the setup, range of motion, and cues."
									autoGrow
									onIonInput={(e) => setDescription(e.detail.value ?? "")}
								/>
							</IonItem>
							<IonItem>
								<IonLabel position="stacked">Exercise type</IonLabel>
								{isTypesLoading ? (
									<IonSpinner />
								) : (
									<IonSelect
										value={exerciseType}
										placeholder="Select type"
										onIonChange={(e) => setExerciseType(e.detail.value ?? "")}
									>
										{exerciseTypes.map((type) => (
											<IonSelectOption key={type} value={type}>
												{formatExerciseType(type)}
											</IonSelectOption>
										))}
									</IonSelect>
								)}
								{exerciseType && (
									<IonNote className="selection-note">
										Selected: {formatExerciseType(exerciseType)}
									</IonNote>
								)}
							</IonItem>
						</IonList>

						<section className="admin-exercise-section">
							<IonLabel className="section-title">Body parts</IonLabel>
							<div className="body-parts-input">
								<IonInput
									value={bodyPartInput}
									placeholder="Add body part (e.g., Chest)"
									onIonInput={(e) => setBodyPartInput(e.detail.value ?? "")}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleAddBodyPart(bodyPartInput);
										}
									}}
								/>
								<IonButton
									onClick={() => handleAddBodyPart(bodyPartInput)}
									disabled={!bodyPartInput.trim()}
								>
									<IonIcon slot="icon-only" icon={add} />
								</IonButton>
							</div>
							{bodyParts.length === 0 ? (
								<IonText color="medium">
									<p>Add at least one body part to continue.</p>
								</IonText>
							) : (
								<div className="body-parts-chips">
									{bodyParts.map((part) => (
										<IonChip key={part} color="primary">
											<IonLabel>{part}</IonLabel>
											<IonIcon
												icon={closeCircle}
												onClick={() => handleRemoveBodyPart(part)}
											/>
										</IonChip>
									))}
								</div>
							)}
							{suggestedBodyParts.length > 0 && (
								<div className="body-parts-suggestions">
									<IonNote>Suggestions:</IonNote>
									<div className="body-parts-chips">
										{suggestedBodyParts.map((part) => (
											<IonChip
												key={part}
												disabled={bodyParts.some(
													(existing) =>
														normalizeValue(existing) === normalizeValue(part),
												)}
												onClick={() => handleAddBodyPart(part)}
											>
												<IonLabel>{part}</IonLabel>
											</IonChip>
										))}
									</div>
								</div>
							)}
						</section>

						<section className="admin-exercise-section">
							<div className="muscle-selection-header">
								<IonLabel className="section-title">Target muscles</IonLabel>
								<IonBadge color="medium">
									Primary {primaryMuscles.length} • Secondary{" "}
									{secondaryMuscles.length}
								</IonBadge>
							</div>
							<div className="muscle-chip-group">
								<div>
									<IonNote>Primary</IonNote>
									<div className="muscle-chip-row">
										{primaryMuscles.length === 0 ? (
											<IonText color="medium">
												<p>Select at least one primary muscle.</p>
											</IonText>
										) : (
											primaryMuscles.map((muscle) => (
												<IonChip key={muscle} color="primary">
													<IonLabel>{muscle}</IonLabel>
												</IonChip>
											))
										)}
									</div>
								</div>
								<div>
									<IonNote>Secondary</IonNote>
									<div className="muscle-chip-row">
										{secondaryMuscles.length === 0 ? (
											<IonText color="medium">
												<p>Optional supporting muscles.</p>
											</IonText>
										) : (
											secondaryMuscles.map((muscle) => (
												<IonChip key={muscle} color="secondary">
													<IonLabel>{muscle}</IonLabel>
												</IonChip>
											))
										)}
									</div>
								</div>
							</div>
							<IonSearchbar
								value={muscleSearch}
								placeholder="Search muscles..."
								onIonInput={(e) => setMuscleSearch(e.detail.value ?? "")}
							/>
							{isMusclesLoading ? (
								<div className="muscle-loading">
									<IonSpinner />
									<IonText>Loading muscles...</IonText>
								</div>
							) : (
								<div className="muscle-list">
									<IonList>
										{filteredMuscles.map((muscle) => {
											const isPrimary = primarySet.has(
												normalizeValue(muscle.name),
											);
											const isSecondary = secondarySet.has(
												normalizeValue(muscle.name),
											);
											const meta = [muscle.major_group, muscle.minor_group]
												.filter(Boolean)
												.join(" • ");
											return (
												<IonItem key={muscle.id}>
													<IonLabel>
														<h3>{muscle.name}</h3>
														{meta && <p>{meta}</p>}
														{muscle.scientific_name && (
															<p className="muscle-scientific">
																{muscle.scientific_name}
															</p>
														)}
													</IonLabel>
													<div slot="end" className="muscle-actions">
														<IonButton
															size="small"
															color={isPrimary ? "primary" : "medium"}
															fill={isPrimary ? "solid" : "outline"}
															onClick={() => togglePrimaryMuscle(muscle)}
														>
															Primary
														</IonButton>
														<IonButton
															size="small"
															color={isSecondary ? "secondary" : "medium"}
															fill={isSecondary ? "solid" : "outline"}
															onClick={() => toggleSecondaryMuscle(muscle)}
														>
															Secondary
														</IonButton>
													</div>
												</IonItem>
											);
										})}
									</IonList>
								</div>
							)}
						</section>

						<section className="admin-exercise-section">
							<IonLabel className="section-title">
								Muscle coverage preview
							</IonLabel>
							<div className="muscle-chart-grid">
								<div>
									<IonNote>Front</IonNote>
									<MuscleChart muscles={muscleStatusMap} view="front" />
								</div>
								<div>
									<IonNote>Back</IonNote>
									<MuscleChart muscles={muscleStatusMap} view="back" />
								</div>
							</div>
						</section>

						{errorMessage && (
							<IonText color="danger">
								<p>{errorMessage}</p>
							</IonText>
						)}

						<div className="admin-exercise-actions">
							<IonButton
								expand="block"
								onClick={handleSubmit}
								disabled={!isFormValid || createExercise.isPending}
							>
								{createExercise.isPending ? (
									<IonSpinner name="dots" />
								) : (
									"Create Exercise"
								)}
							</IonButton>
							<IonButton
								expand="block"
								fill="outline"
								onClick={handleReset}
								disabled={createExercise.isPending}
							>
								Clear form
							</IonButton>
						</div>
					</>
				)}
				<IonToast
					isOpen={showToast}
					message={toastMessage}
					duration={2000}
					onDidDismiss={() => setShowToast(false)}
				/>
			</IonContent>
		</IonModal>
	);
}
