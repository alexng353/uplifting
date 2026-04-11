import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import {
  generateId,
  getProfiles,
  type StoredSet,
  type StoredWorkout,
  type StoredWorkoutExercise,
} from "../services/storage";
import {
  type WorkoutActions,
  EditWorkoutContext,
  EditWorkoutMetaContext,
} from "./useWorkoutActions";
import {
  addExerciseMutation,
  addSetMutation,
  addUnilateralPairMutation,
  changeExerciseProfileMutation,
  removeExerciseMutation,
  removeLastSetMutation,
  removeLastUnilateralPairMutation,
  removeSetMutation,
  reorderExercisesMutation,
  toggleUnilateralMutation,
  updateSetMutation,
} from "../lib/workout-mutations";

function transformToStoredWorkout(
  serverWorkout: any,
  exerciseMap: Map<string, any>,
): StoredWorkout {
  // Use locally cached profiles for display names
  const profiles = getProfiles();
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const exercises: StoredWorkoutExercise[] = (serverWorkout.exercises ?? []).map((group: any) => {
    const exercise = exerciseMap.get(group.exercise_id);
    const profile = group.profile_id ? profileMap.get(group.profile_id) : null;
    const baseName = exercise?.name ?? "Unknown Exercise";
    const displayName = profile ? `${baseName} (${profile.name})` : baseName;

    return {
      exerciseId: group.exercise_id,
      profileId: group.profile_id ?? undefined,
      exerciseName: displayName,
      exerciseType: exercise?.exercise_type,
      isUnilateral: group.is_unilateral,
      sets: group.sets.map((s: any) => ({
        id: s.id ?? generateId(),
        reps: s.reps,
        weight: Number(s.weight),
        weightUnit: s.weightUnit ?? s.weight_unit ?? "kg",
        createdAt: s.createdAt ?? s.created_at ?? new Date().toISOString(),
        side: s.side as "L" | "R" | undefined,
        bodyweight: s.bodyweight ? Number(s.bodyweight) : undefined,
      })),
    };
  });

  return {
    id: serverWorkout.id,
    startTime:
      typeof serverWorkout.startTime === "string"
        ? serverWorkout.startTime
        : new Date(serverWorkout.startTime).toISOString(),
    endTime: serverWorkout.endTime
      ? typeof serverWorkout.endTime === "string"
        ? serverWorkout.endTime
        : new Date(serverWorkout.endTime).toISOString()
      : undefined,
    exercises,
    name: serverWorkout.name ?? undefined,
    privacy: serverWorkout.privacy ?? "friends",
    gymLocation: serverWorkout.gymLocation ?? undefined,
    kind: serverWorkout.kind ?? "workout",
  };
}

export function useEditWorkoutState(workoutId: string) {
  const queryClient = useQueryClient();
  const [workout, setWorkout] = useState<StoredWorkout | null>(null);
  const initialRef = useRef<string | null>(null);

  // Fetch workout
  const { isLoading, error: fetchError } = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: async () => unwrap(await api.api.v1.workouts({ workoutId }).get()),
    enabled: !!workoutId,
  });

  // Fetch exercise names
  const { data: exerciseList } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () =>
      unwrap(await api.api.v1.exercises.get({ query: { limit: "500" } })),
  });

  const exerciseMap = useMemo(
    () => new Map((exerciseList ?? []).map((e: any) => [e.id, e])),
    [exerciseList],
  );

  // Get cached workout data
  const cachedWorkout = queryClient.getQueryData(["workout", workoutId]) as any;

  // Seed local state once
  if (cachedWorkout && exerciseList && workout === null) {
    const transformed = transformToStoredWorkout(cachedWorkout, exerciseMap);
    setWorkout(transformed);
    initialRef.current = JSON.stringify(transformed);
  }

  const hasChanges =
    workout !== null &&
    initialRef.current !== null &&
    JSON.stringify(workout) !== initialRef.current;

  // Save mutation — PUT with full exercises
  const saveMutation = useMutation({
    mutationFn: async (w: StoredWorkout) => {
      return unwrap(
        await api.api.v1.workouts({ workoutId }).put({
          name: w.name,
          start_time: w.startTime,
          end_time: w.endTime,
          privacy: w.privacy,
          gym_location: w.gymLocation,
          exercises: w.exercises.map((e) => ({
            exercise_id: e.exerciseId,
            profile_id: e.profileId,
            sets: e.sets
              .filter((s) => s.reps != null && s.reps > 0)
              .map((s) => ({
                reps: s.reps ?? 1,
                weight: s.weight ?? 0,
                weight_unit: s.weightUnit,
                created_at: s.createdAt,
                side: s.side,
                bodyweight: s.bodyweight,
              })),
          })),
        }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["all-time-stats"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () =>
      unwrap(await api.api.v1.workouts({ workoutId }).delete()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["all-time-stats"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
    },
  });

  // Apply a pure mutation to local state
  const apply = useCallback((fn: (w: StoredWorkout) => StoredWorkout) => {
    setWorkout((prev) => (prev ? fn(prev) : prev));
  }, []);

  // Build WorkoutActions
  const actions: WorkoutActions | null = workout
    ? {
        workout,
        isActive: true,
        mode: "editing",
        addExercise: (exerciseId, exerciseName, profileId?, exerciseType?) =>
          apply((w) =>
            addExerciseMutation(w, exerciseId, exerciseName, profileId, exerciseType),
          ),
        removeExercise: (exerciseId) =>
          apply((w) => removeExerciseMutation(w, exerciseId)),
        reorderExercises: (newOrder) =>
          apply((w) => reorderExercisesMutation(w, newOrder)),
        addSet: (exerciseId, weightUnit, reps?, weight?, side?) =>
          apply((w) => addSetMutation(w, exerciseId, weightUnit, reps, weight, side)),
        addUnilateralPair: (exerciseId, weightUnit, reps?, weight?) =>
          apply((w) =>
            addUnilateralPairMutation(w, exerciseId, weightUnit, reps, weight),
          ),
        updateSet: (exerciseId, setId, updates) =>
          apply((w) => updateSetMutation(w, exerciseId, setId, updates)),
        removeSet: (exerciseId, setId) =>
          apply((w) => removeSetMutation(w, exerciseId, setId)),
        removeLastSet: (exerciseId) =>
          apply((w) => removeLastSetMutation(w, exerciseId)),
        removeLastUnilateralPair: (exerciseId) =>
          apply((w) => removeLastUnilateralPairMutation(w, exerciseId)),
        toggleUnilateral: (exerciseId) =>
          apply((w) => toggleUnilateralMutation(w, exerciseId)),
        changeExerciseProfile: (exerciseId, profileId, exerciseName) =>
          apply((w) =>
            changeExerciseProfileMutation(w, exerciseId, profileId, exerciseName),
          ),
      }
    : null;

  return {
    workout,
    setWorkout,
    actions,
    isReady: workout !== null,
    isLoading,
    fetchError: fetchError?.message ?? null,
    hasChanges,
    save: () => workout && saveMutation.mutateAsync(workout),
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error?.message ?? null,
    deleteWorkout: () => deleteMutation.mutateAsync(),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
}

export function EditWorkoutProvider({
  workoutId,
  children,
}: {
  workoutId: string;
  children: ReactNode;
}) {
  const state = useEditWorkoutState(workoutId);
  if (!state.actions) return null;

  const meta = {
    workout: state.workout,
    setWorkout: state.setWorkout,
    hasChanges: state.hasChanges,
    save: () => Promise.resolve(state.save()),
    isSaving: state.isSaving,
    saveError: state.saveError,
    deleteWorkout: state.deleteWorkout,
    isDeleting: state.isDeleting,
    deleteError: state.deleteError,
    actions: state.actions,
  };

  return (
    <EditWorkoutMetaContext.Provider value={meta}>
      <EditWorkoutContext.Provider value={state.actions}>
        {children}
      </EditWorkoutContext.Provider>
    </EditWorkoutMetaContext.Provider>
  );
}
