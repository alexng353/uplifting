import { IonButton, IonIcon, IonInput, IonList, IonToggle } from "@ionic/react";
import { add, close, syncOutline, trash } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "../../../hooks/useSettings";
import { useWorkout } from "../../../hooks/useWorkout";
import type {
	StoredSet,
	StoredWorkoutExercise,
} from "../../../services/local-storage";
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
	onInputFocus: () => void;
	onInputBlur: () => void;
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
				type="number"
				inputMode="decimal"
				value={set.reps}
				placeholder={String(DEFAULT_REPS)}
				onIonFocus={onInputFocus}
				onIonBlur={onInputBlur}
				onIonChange={(e) =>
					updateSet(exerciseId, set.id, {
						reps: e.detail.value ? Number(e.detail.value) : undefined,
					})
				}
			/>
			<IonInput
				type="number"
				inputMode="decimal"
				value={set.weight}
				placeholder={String(DEFAULT_WEIGHT)}
				onIonFocus={onInputFocus}
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
}: {
	set: StoredSet;
	exerciseId: string;
	displayUnit: string;
	updateSet: (
		exerciseId: string,
		setId: string,
		updates: Partial<StoredSet>,
	) => void;
	onInputFocus: () => void;
	onInputBlur: () => void;
}) {
	return (
		<div className="set-row unilateral-row left-row">
			<div className="set-number" />
			<div className="side-label left">L</div>
			<IonInput
				type="number"
				inputMode="decimal"
				value={set.reps}
				placeholder={String(DEFAULT_REPS)}
				onIonFocus={onInputFocus}
				onIonBlur={onInputBlur}
				onIonChange={(e) =>
					updateSet(exerciseId, set.id, {
						reps: e.detail.value ? Number(e.detail.value) : undefined,
					})
				}
			/>
			<IonInput
				type="number"
				inputMode="decimal"
				value={set.weight}
				placeholder={String(DEFAULT_WEIGHT)}
				onIonFocus={onInputFocus}
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
	} = useWorkout();
	const { getDisplayUnit } = useSettings();
	const setsContainerRef = useRef<HTMLDivElement>(null);
	const [isInputFocused, setIsInputFocused] = useState(false);

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

	const syncInputFocusState = useCallback(() => {
		const activeElement = document.activeElement;
		setIsInputFocused(isElementWithinSetsContainer(activeElement));
	}, [isElementWithinSetsContainer]);

	const handleInputFocus = useCallback(() => {
		syncInputFocusState();
	}, [syncInputFocusState]);

	const handleInputBlur = useCallback(() => {
		requestAnimationFrame(() => {
			syncInputFocusState();
		});
	}, [syncInputFocusState]);

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

	// Can only remove if more than 1 set (or more than 1 pair in unilateral mode)
	const canRemove = exercise.isUnilateral
		? setGroups.length > 1
		: exercise.sets.length > 1;
	const canDuplicate = exercise.sets.length > 0;

	if (exercise.isUnilateral) {
		return (
			<div className="exercise-slide">
				<div className="exercise-slide-header">
					<h2>{exercise.exerciseName}</h2>
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
						{setGroups.map((group) => (
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
									/>
								)}
							</div>
						))}
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
			</div>
		);
	}

	// Normal (non-unilateral) mode
	return (
		<div className="exercise-slide">
			<div className="exercise-slide-header">
				<h2>{exercise.exerciseName}</h2>
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
					{exercise.sets.map((set, index) => (
						<SetRow
							key={set.id}
							set={set}
							setNumber={index + 1}
							exerciseId={exercise.exerciseId}
							displayUnit={displayUnit}
							updateSet={updateSet}
							onInputFocus={handleInputFocus}
							onInputBlur={handleInputBlur}
						/>
					))}
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
		</div>
	);
}
