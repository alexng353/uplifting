import { Keyboard } from "@capacitor/keyboard";
import {
	IonActionSheet,
	IonButton,
	IonIcon,
	IonInput,
	IonList,
	IonToggle,
} from "@ionic/react";
import { add, close, syncOutline, trash } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useExerciseProfiles } from "../../../hooks/useExerciseProfiles";
import { useGymProfileSuggestion } from "../../../hooks/useGymProfileSuggestion";
import { usePreviousSets } from "../../../hooks/usePreviousSets";
import { useSettings } from "../../../hooks/useSettings";
import { useWorkout } from "../../../hooks/useWorkout";
import type {
	StoredSet,
	StoredWorkoutExercise,
} from "../../../services/local-storage";
import KeyboardAccessoryBar from "./KeyboardAccessoryBar";
import RestTimer from "./RestTimer";

interface ExerciseSlideProps {
	exercise: StoredWorkoutExercise;
}

interface SetPair {
	setNumber: number;
	rightSet?: StoredSet;
	leftSet?: StoredSet;
}

const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = 20;

function SetRow({
	set,
	setNumber,
	sideLabel,
	exerciseId,
	displayUnit,
	updateSet,
	onInputFocus,
	onInputBlur,
	repsRef,
	weightRef,
	suggestedReps,
	suggestedWeight,
}: {
	set: StoredSet;
	setNumber: number;
	sideLabel?: "R" | "L";
	exerciseId: string;
	displayUnit: string;
	updateSet: (
		exerciseId: string,
		setId: string,
		updates: Partial<StoredSet>,
	) => void;
	onInputFocus: (e: CustomEvent) => void;
	onInputBlur: () => void;
	repsRef?: (el: HTMLIonInputElement | null) => void;
	weightRef?: (el: HTMLIonInputElement | null) => void;
	suggestedReps: number;
	suggestedWeight: number;
}) {
	const isUnilateral = !!sideLabel;

	return (
		<div className={`set-row ${isUnilateral ? "unilateral-row" : ""}`}>
			<div className="set-number">{setNumber}</div>
			{isUnilateral && (
				<div className={`side-label ${sideLabel === "R" ? "right" : "left"}`}>
					{sideLabel}
				</div>
			)}
			<IonInput
				ref={repsRef}
				type="number"
				inputMode="decimal"
				value={set.reps}
				placeholder={String(suggestedReps)}
				onIonFocus={(e) => onInputFocus(e)}
				onIonBlur={onInputBlur}
				onIonChange={(e) =>
					updateSet(exerciseId, set.id, {
						reps: e.detail.value ? Number(e.detail.value) : undefined,
					})
				}
			/>
			<IonInput
				ref={weightRef}
				type="number"
				inputMode="decimal"
				value={set.weight}
				placeholder={String(suggestedWeight)}
				onIonFocus={(e) => onInputFocus(e)}
				onIonBlur={onInputBlur}
				onIonChange={(e) =>
					updateSet(exerciseId, set.id, {
						weight: e.detail.value ? Number(e.detail.value) : undefined,
					})
				}
			/>
			<div className="unit-label">{displayUnit}</div>
		</div>
	);
}

function LeftSetRow({
	set,
	exerciseId,
	displayUnit,
	updateSet,
	onInputFocus,
	onInputBlur,
	repsRef,
	weightRef,
	suggestedReps,
	suggestedWeight,
}: {
	set: StoredSet;
	exerciseId: string;
	displayUnit: string;
	updateSet: (
		exerciseId: string,
		setId: string,
		updates: Partial<StoredSet>,
	) => void;
	onInputFocus: (e: CustomEvent) => void;
	onInputBlur: () => void;
	repsRef?: (el: HTMLIonInputElement | null) => void;
	weightRef?: (el: HTMLIonInputElement | null) => void;
	suggestedReps: number;
	suggestedWeight: number;
}) {
	return (
		<div className="set-row unilateral-row left-row">
			<div className="set-number" />
			<div className="side-label left">L</div>
			<IonInput
				ref={repsRef}
				type="number"
				inputMode="decimal"
				value={set.reps}
				placeholder={String(suggestedReps)}
				onIonFocus={(e) => onInputFocus(e)}
				onIonBlur={onInputBlur}
				onIonChange={(e) =>
					updateSet(exerciseId, set.id, {
						reps: e.detail.value ? Number(e.detail.value) : undefined,
					})
				}
			/>
			<IonInput
				ref={weightRef}
				type="number"
				inputMode="decimal"
				value={set.weight}
				placeholder={String(suggestedWeight)}
				onIonFocus={(e) => onInputFocus(e)}
				onIonBlur={onInputBlur}
				onIonChange={(e) =>
					updateSet(exerciseId, set.id, {
						weight: e.detail.value ? Number(e.detail.value) : undefined,
					})
				}
			/>
			<div className="unit-label">{displayUnit}</div>
		</div>
	);
}

export default function ExerciseSlide({ exercise }: ExerciseSlideProps) {
	const {
		addSet,
		addUnilateralPair,
		updateSet,
		toggleUnilateral,
		removeLastSet,
		removeLastUnilateralPair,
		removeExercise,
		changeExerciseProfile,
	} = useWorkout();
	const { getDisplayUnit } = useSettings();
	const { getSuggestion } = usePreviousSets();
	const { data: profiles = [] } = useExerciseProfiles(exercise.exerciseId);
	const { getSuggestedProfile, recordProfileUsage, currentGymId } =
		useGymProfileSuggestion();
	const setsContainerRef = useRef<HTMLDivElement>(null);
	const [isInputFocused, setIsInputFocused] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
	const [showProfileSheet, setShowProfileSheet] = useState(false);

	// Create refs for all inputs
	// For normal mode: [set0-reps, set0-weight, set1-reps, set1-weight, ...]
	// For unilateral: [set0-R-reps, set0-R-weight, set0-L-reps, set0-L-weight, ...]
	const inputRefsMap = useRef<Map<string, HTMLIonInputElement>>(new Map());

	const displayUnit = getDisplayUnit();

	const isElementWithinSetsContainer = useCallback(
		(element: Element | null) => {
			const container = setsContainerRef.current;
			if (!container || !element) {
				return false;
			}

			if (container.contains(element)) {
				return true;
			}

			const rootNode = element.getRootNode();
			if (rootNode instanceof ShadowRoot) {
				return container.contains(rootNode.host);
			}

			return false;
		},
		[],
	);

	// Group sets into pairs for unilateral mode
	const setGroups = useMemo((): SetPair[] => {
		if (!exercise.isUnilateral) {
			return exercise.sets.map((set, index) => ({
				setNumber: index + 1,
				rightSet: set,
			}));
		}

		const pairs: SetPair[] = [];
		const rightSets = exercise.sets.filter((s) => s.side === "R");
		const leftSets = exercise.sets.filter((s) => s.side === "L");
		const maxLen = Math.max(rightSets.length, leftSets.length);

		for (let i = 0; i < maxLen; i++) {
			pairs.push({
				setNumber: i + 1,
				rightSet: rightSets[i],
				leftSet: leftSets[i],
			});
		}

		return pairs;
	}, [exercise.sets, exercise.isUnilateral]);

	// Build ordered list of input keys for navigation
	// Normal mode: set0-reps, set0-weight, set1-reps, set1-weight, ...
	// Unilateral: set0-R-reps, set0-R-weight, set0-L-reps, set0-L-weight, ...
	const orderedInputKeys = useMemo(() => {
		const keys: string[] = [];
		if (exercise.isUnilateral) {
			for (const group of setGroups) {
				if (group.rightSet) {
					keys.push(`${group.rightSet.id}-reps`);
					keys.push(`${group.rightSet.id}-weight`);
				}
				if (group.leftSet) {
					keys.push(`${group.leftSet.id}-reps`);
					keys.push(`${group.leftSet.id}-weight`);
				}
			}
		} else {
			for (const set of exercise.sets) {
				keys.push(`${set.id}-reps`);
				keys.push(`${set.id}-weight`);
			}
		}
		return keys;
	}, [exercise.sets, exercise.isUnilateral, setGroups]);

	// Track which input is focused by finding it in orderedInputKeys
	const updateFocusedIndex = useCallback(
		(ionInput: HTMLIonInputElement) => {
			for (const [key, ref] of inputRefsMap.current.entries()) {
				if (ref === ionInput) {
					const index = orderedInputKeys.indexOf(key);
					setFocusedIndex(index >= 0 ? index : null);
					return;
				}
			}
			setFocusedIndex(null);
		},
		[orderedInputKeys],
	);

	const syncInputFocusState = useCallback(() => {
		const activeElement = document.activeElement;
		setIsInputFocused(isElementWithinSetsContainer(activeElement));
	}, [isElementWithinSetsContainer]);

	const handleInputFocus = useCallback(
		async (event: CustomEvent) => {
			syncInputFocusState();
			// Track which input is focused for keyboard navigation
			const ionInput = event.target as HTMLIonInputElement;
			updateFocusedIndex(ionInput);
			// Auto-select all text for easier mobile input
			const nativeInput = await ionInput.getInputElement();
			nativeInput.select();
		},
		[syncInputFocusState, updateFocusedIndex],
	);

	const handleInputBlur = useCallback(() => {
		requestAnimationFrame(() => {
			syncInputFocusState();
			// Only clear focused index if no input is focused
			if (!isElementWithinSetsContainer(document.activeElement)) {
				setFocusedIndex(null);
			}
		});
	}, [syncInputFocusState, isElementWithinSetsContainer]);

	useEffect(() => {
		if (!isInputFocused) {
			return;
		}

		syncInputFocusState();
	}, [isInputFocused, syncInputFocusState]);

	// Auto-scroll to bottom when sets change
	const setsLength = exercise.sets.length;
	useEffect(() => {
		if (setsLength > 0 && setsContainerRef.current) {
			// Wait for DOM to update before scrolling
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (setsContainerRef.current) {
						setsContainerRef.current.scrollTo({
							top: setsContainerRef.current.scrollHeight,
							behavior: "smooth",
						});
					}
				});
			});
		}
	}, [setsLength]);

	// Get the last set's values for duplicating
	const lastSet = exercise.sets[exercise.sets.length - 1];
	const lastRightSet = exercise.isUnilateral
		? exercise.sets.filter((s) => s.side === "R").slice(-1)[0]
		: null;

	// Add set without values (first set) - leave empty with placeholders
	const handleAddSet = useCallback(() => {
		addSet(exercise.exerciseId, displayUnit);
	}, [exercise.exerciseId, addSet, displayUnit]);

	const handleAddUnilateralPair = useCallback(() => {
		addUnilateralPair(exercise.exerciseId, displayUnit);
	}, [exercise.exerciseId, addUnilateralPair, displayUnit]);

	// Duplicate last set with its values
	const handleDuplicateLastSet = useCallback(() => {
		if (exercise.isUnilateral) {
			if (!lastRightSet) return;
			addUnilateralPair(
				exercise.exerciseId,
				lastRightSet.weightUnit,
				lastRightSet.reps ?? DEFAULT_REPS,
				lastRightSet.weight ?? DEFAULT_WEIGHT,
			);
		} else {
			if (!lastSet) return;
			addSet(
				exercise.exerciseId,
				lastSet.weightUnit,
				lastSet.reps ?? DEFAULT_REPS,
				lastSet.weight ?? DEFAULT_WEIGHT,
			);
		}
	}, [
		exercise.exerciseId,
		exercise.isUnilateral,
		lastSet,
		lastRightSet,
		addSet,
		addUnilateralPair,
	]);

	const handleRemoveLastSet = useCallback(() => {
		if (exercise.isUnilateral) {
			removeLastUnilateralPair(exercise.exerciseId);
		} else {
			removeLastSet(exercise.exerciseId);
		}
	}, [
		exercise.exerciseId,
		exercise.isUnilateral,
		removeLastSet,
		removeLastUnilateralPair,
	]);

	const handleToggleUnilateral = useCallback(() => {
		toggleUnilateral(exercise.exerciseId);
	}, [exercise.exerciseId, toggleUnilateral]);

	const handleRemoveExercise = useCallback(() => {
		void removeExercise(exercise.exerciseId);
	}, [exercise.exerciseId, removeExercise]);

	// Extract base exercise name (without profile suffix)
	const baseName = useMemo(() => {
		if (exercise.profileId) {
			return exercise.exerciseName.replace(/\s*\([^)]+\)$/, "");
		}
		return exercise.exerciseName;
	}, [exercise.exerciseName, exercise.profileId]);

	const handleChangeProfile = useCallback(
		(profileId?: string, profileName?: string) => {
			const displayName = profileName
				? `${baseName} (${profileName})`
				: baseName;
			changeExerciseProfile(exercise.exerciseId, profileId, displayName);

			if (profileId) {
				recordProfileUsage(exercise.exerciseId, profileId);
			}

			setShowProfileSheet(false);
		},
		[
			exercise.exerciseId,
			baseName,
			changeExerciseProfile,
			recordProfileUsage,
		],
	);

	const profileActions = useMemo(() => {
		if (profiles.length === 0) return [];

		const suggestedProfileId = getSuggestedProfile(exercise.exerciseId);

		return [
			{
				text: exercise.profileId
					? "Default (no profile)"
					: "Default (no profile) ✓",
				handler: () => handleChangeProfile(),
			},
			...profiles.map((p) => {
				const isCurrent = p.id === exercise.profileId;
				const isSuggested = p.id === suggestedProfileId && currentGymId;
				let text = p.name;
				if (isSuggested) text += " (last used here)";
				if (isCurrent) text += " ✓";
				return {
					text,
					handler: () => handleChangeProfile(p.id, p.name),
				};
			}),
			{
				text: "Cancel",
				role: "cancel" as const,
			},
		];
	}, [
		profiles,
		exercise.exerciseId,
		exercise.profileId,
		getSuggestedProfile,
		currentGymId,
		handleChangeProfile,
	]);

	const hasProfiles = profiles.length > 0;

	// Helper to create ref callbacks for inputs
	const createRefCallback = useCallback(
		(key: string) => (el: HTMLIonInputElement | null) => {
			if (el) {
				inputRefsMap.current.set(key, el);
			} else {
				inputRefsMap.current.delete(key);
			}
		},
		[],
	);

	// Handle Next button - focus next input
	const handleNext = useCallback(async () => {
		if (focusedIndex === null) return;
		const nextIndex = focusedIndex + 1;
		if (nextIndex < orderedInputKeys.length) {
			const nextKey = orderedInputKeys[nextIndex];
			const nextInput = inputRefsMap.current.get(nextKey);
			if (nextInput) {
				const native = await nextInput.getInputElement();
				native.focus();
			}
		}
	}, [focusedIndex, orderedInputKeys]);

	// Handle Done button - dismiss keyboard
	const handleDone = useCallback(() => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		// Also try Capacitor Keyboard plugin
		Keyboard.hide().catch(() => {
			// Ignore errors on web
		});
	}, []);

	// Whether we're on the last input
	const isLastInput =
		focusedIndex !== null && focusedIndex === orderedInputKeys.length - 1;

	// Can only remove if more than 1 set (or more than 1 pair in unilateral mode)
	const canRemove = exercise.isUnilateral
		? setGroups.length > 1
		: exercise.sets.length > 1;
	const canDuplicate = exercise.sets.length > 0;

	if (exercise.isUnilateral) {
		return (
			<div className="exercise-slide">
				<div className="exercise-slide-header">
					<h2
						className={hasProfiles ? "tappable-name" : undefined}
						onClick={hasProfiles ? () => setShowProfileSheet(true) : undefined}
					>
						{exercise.exerciseName}
					</h2>
					<div className="exercise-slide-controls">
						<IonToggle
							checked={exercise.isUnilateral}
							onIonChange={handleToggleUnilateral}
							labelPlacement="start"
						>
							Unilateral
						</IonToggle>
						<IonButton
							className="exercise-remove-button"
							color="danger"
							onClick={handleRemoveExercise}
						>
							<IonIcon slot="start" icon={trash} />
							Remove Exercise
						</IonButton>
					</div>
				</div>

				<div className="sets-container" ref={setsContainerRef}>
					<div className="set-row header unilateral-header">
						<div>Set</div>
						<div>Side</div>
						<div>Reps</div>
						<div>Weight</div>
						<div />
					</div>

					<IonList>
						{setGroups.map((group) => {
							const rightSuggestion = getSuggestion(
								exercise.exerciseId,
								exercise.profileId,
								group.setNumber,
								"R",
							);
							const leftSuggestion = getSuggestion(
								exercise.exerciseId,
								exercise.profileId,
								group.setNumber,
								"L",
							);
							return (
								<div key={group.setNumber} className="unilateral-group">
									{/* Right side row */}
									{group.rightSet && (
										<SetRow
											set={group.rightSet}
											setNumber={group.setNumber}
											sideLabel="R"
											exerciseId={exercise.exerciseId}
											displayUnit={displayUnit}
											updateSet={updateSet}
											onInputFocus={handleInputFocus}
											onInputBlur={handleInputBlur}
											repsRef={createRefCallback(`${group.rightSet.id}-reps`)}
											weightRef={createRefCallback(
												`${group.rightSet.id}-weight`,
											)}
											suggestedReps={rightSuggestion.reps ?? DEFAULT_REPS}
											suggestedWeight={rightSuggestion.weight ?? DEFAULT_WEIGHT}
										/>
									)}
									{/* Left side row */}
									{group.leftSet && (
										<LeftSetRow
											set={group.leftSet}
											exerciseId={exercise.exerciseId}
											displayUnit={displayUnit}
											updateSet={updateSet}
											onInputFocus={handleInputFocus}
											onInputBlur={handleInputBlur}
											repsRef={createRefCallback(`${group.leftSet.id}-reps`)}
											weightRef={createRefCallback(
												`${group.leftSet.id}-weight`,
											)}
											suggestedReps={leftSuggestion.reps ?? DEFAULT_REPS}
											suggestedWeight={leftSuggestion.weight ?? DEFAULT_WEIGHT}
										/>
									)}
								</div>
							);
						})}
					</IonList>
				</div>

				<RestTimer isHidden={isInputFocused} />

				<div
					className={`set-actions-container${
						isInputFocused ? " is-hidden" : ""
					}`}
				>
					<IonButton
						className="set-action-button add-button"
						fill="outline"
						onClick={handleAddUnilateralPair}
					>
						<IonIcon slot="icon-only" icon={add} />
					</IonButton>
					<IonButton
						className="set-action-button duplicate-button"
						fill="outline"
						onClick={handleDuplicateLastSet}
						disabled={!canDuplicate}
					>
						<IonIcon slot="icon-only" icon={syncOutline} />
					</IonButton>
					<IonButton
						className="set-action-button remove-button"
						fill="outline"
						onClick={handleRemoveLastSet}
						disabled={!canRemove}
					>
						<IonIcon slot="icon-only" icon={close} />
					</IonButton>
				</div>

				<KeyboardAccessoryBar
					isVisible={isInputFocused}
					onNext={handleNext}
					onDone={handleDone}
					showNext={!isLastInput}
				/>

				<IonActionSheet
					isOpen={showProfileSheet}
					onDidDismiss={() => setShowProfileSheet(false)}
					header={`Change profile for ${baseName}`}
					subHeader="Select a profile"
					buttons={profileActions}
				/>
			</div>
		);
	}

	// Normal (non-unilateral) mode
	return (
		<div className="exercise-slide">
			<div className="exercise-slide-header">
				<h2
					className={hasProfiles ? "tappable-name" : undefined}
					onClick={hasProfiles ? () => setShowProfileSheet(true) : undefined}
				>
					{exercise.exerciseName}
				</h2>
				<div className="exercise-slide-controls">
					<IonToggle
						checked={exercise.isUnilateral ?? false}
						onIonChange={handleToggleUnilateral}
						labelPlacement="start"
					>
						Unilateral
					</IonToggle>
					<IonButton
						className="exercise-remove-button"
						color="danger"
						onClick={handleRemoveExercise}
					>
						<IonIcon slot="start" icon={trash} />
						Remove Exercise
					</IonButton>
				</div>
			</div>

			<div className="sets-container" ref={setsContainerRef}>
				<div className="set-row header">
					<div>Set</div>
					<div>Reps</div>
					<div>Weight</div>
					<div />
				</div>

				<IonList>
					{exercise.sets.map((set, index) => {
						const suggestion = getSuggestion(
							exercise.exerciseId,
							exercise.profileId,
							index + 1,
						);
						return (
							<SetRow
								key={set.id}
								set={set}
								setNumber={index + 1}
								exerciseId={exercise.exerciseId}
								displayUnit={displayUnit}
								updateSet={updateSet}
								onInputFocus={handleInputFocus}
								onInputBlur={handleInputBlur}
								repsRef={createRefCallback(`${set.id}-reps`)}
								weightRef={createRefCallback(`${set.id}-weight`)}
								suggestedReps={suggestion.reps ?? DEFAULT_REPS}
								suggestedWeight={suggestion.weight ?? DEFAULT_WEIGHT}
							/>
						);
					})}
				</IonList>
			</div>

			<RestTimer isHidden={isInputFocused} />

			<div
				className={`set-actions-container${isInputFocused ? " is-hidden" : ""}`}
			>
				<IonButton
					className="set-action-button add-button"
					fill="outline"
					onClick={handleAddSet}
				>
					<IonIcon slot="icon-only" icon={add} />
				</IonButton>
				<IonButton
					className="set-action-button duplicate-button"
					fill="outline"
					onClick={handleDuplicateLastSet}
					disabled={!canDuplicate}
				>
					<IonIcon slot="icon-only" icon={syncOutline} />
				</IonButton>
				<IonButton
					className="set-action-button remove-button"
					fill="outline"
					onClick={handleRemoveLastSet}
					disabled={!canRemove}
				>
					<IonIcon slot="icon-only" icon={close} />
				</IonButton>
			</div>

			<KeyboardAccessoryBar
				isVisible={isInputFocused}
				onNext={handleNext}
				onDone={handleDone}
				showNext={!isLastInput}
			/>

			<IonActionSheet
				isOpen={showProfileSheet}
				onDidDismiss={() => setShowProfileSheet(false)}
				header={`Change profile for ${baseName}`}
				subHeader="Select a profile"
				buttons={profileActions}
			/>
		</div>
	);
}
