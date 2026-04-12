import { createContext, useContext } from "react";
import type { StoredSet, StoredWorkout } from "../services/storage";
import { useWorkout } from "./useWorkout";

export interface WorkoutActions {
  workout: StoredWorkout | null;
  isActive: boolean;
  mode: "live" | "editing";
  addExercise: (
    exerciseId: string,
    exerciseName: string,
    profileId?: string,
    exerciseType?: string,
  ) => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (newOrder: string[]) => void;
  addSet: (
    exerciseId: string,
    weightUnit: string,
    reps?: number,
    weight?: number,
    side?: "L" | "R",
  ) => void;
  addUnilateralPair: (
    exerciseId: string,
    weightUnit: string,
    reps?: number,
    weight?: number,
  ) => void;
  updateSet: (exerciseId: string, setId: string, updates: Partial<StoredSet>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  removeLastSet: (exerciseId: string) => void;
  removeLastUnilateralPair: (exerciseId: string) => void;
  toggleUnilateral: (exerciseId: string) => void;
  changeExerciseProfile: (
    exerciseId: string,
    profileId: string | undefined,
    exerciseName: string,
  ) => void;
}

// EditWorkoutContext — provided by EditWorkoutProvider (created in Task 5).
// Defined here to avoid circular imports.
export const EditWorkoutContext = createContext<WorkoutActions | null>(null);

// Meta context for edit-specific state (save, delete, etc.)
export interface EditWorkoutMeta {
  workout: StoredWorkout | null;
  setWorkout: (w: StoredWorkout | ((prev: StoredWorkout) => StoredWorkout)) => void;
  hasChanges: boolean;
  save: () => Promise<unknown>;
  isSaving: boolean;
  saveError: string | null;
  deleteWorkout: () => Promise<unknown>;
  isDeleting: boolean;
  deleteError: string | null;
  actions: WorkoutActions | null;
}

export const EditWorkoutMetaContext = createContext<EditWorkoutMeta | null>(null);

export function useEditWorkoutMeta(): EditWorkoutMeta {
  const context = useContext(EditWorkoutMetaContext);
  if (!context) {
    throw new Error("useEditWorkoutMeta must be used within EditWorkoutProvider");
  }
  return context;
}

export function useWorkoutActions(): WorkoutActions {
  const editContext = useContext(EditWorkoutContext);
  // Always call useWorkout() unconditionally to satisfy React's rules of hooks.
  // WorkoutProvider wraps the entire app, so this always succeeds.
  const liveWorkout = useWorkout();

  if (editContext) return editContext;

  return {
    workout: liveWorkout.workout,
    isActive: liveWorkout.isActive,
    mode: "live",
    addExercise: liveWorkout.addExercise,
    removeExercise: liveWorkout.removeExercise,
    reorderExercises: liveWorkout.reorderExercises,
    addSet: liveWorkout.addSet,
    addUnilateralPair: liveWorkout.addUnilateralPair,
    updateSet: liveWorkout.updateSet,
    removeSet: liveWorkout.removeSet,
    removeLastSet: liveWorkout.removeLastSet,
    removeLastUnilateralPair: liveWorkout.removeLastUnilateralPair,
    toggleUnilateral: liveWorkout.toggleUnilateral,
    changeExerciseProfile: liveWorkout.changeExerciseProfile,
  };
}
