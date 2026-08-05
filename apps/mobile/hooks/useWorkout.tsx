import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { detectAndSetNearbyGym } from "../services/geolocation";
import {
  addExerciseSequence,
  clearTodayRestDay,
  generateId,
  getCurrentWorkout,
  getLocalDateString,
  getPendingWorkout,
  getSettings,
  getTodayRestDay,
  setTodayRestDay,
  type StoredSet,
  type StoredWorkout,
  type TodayRestDay,
  setCurrentWorkout,
  setPendingWorkout,
  updatePreviousSets,
} from "../services/storage";
import {
  addExerciseMutation,
  removeExerciseMutation,
  reorderExercisesMutation,
  addSetMutation,
  addUnilateralPairMutation,
  updateSetMutation,
  removeSetMutation,
  removeLastSetMutation,
  removeLastUnilateralPairMutation,
  toggleUnilateralMutation,
  changeExerciseProfileMutation,
  trimTrailingEmptySetsMutation,
} from "../lib/workout-mutations";

interface WorkoutContextValue {
  workout: StoredWorkout | null;
  isActive: boolean;
  todayRestDay: TodayRestDay | null;
  startWorkout: () => void;
  logRestDay: () => StoredWorkout | null;
  cancelRestDay: () => string | undefined;
  reconcileRestDay: (serverWorkouts: any[]) => void;
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
  trimTrailingEmptySets: (exerciseId: string, keepCount?: number) => void;
  toggleUnilateral: (exerciseId: string) => void;
  changeExerciseProfile: (
    exerciseId: string,
    profileId: string | undefined,
    exerciseName: string,
  ) => void;
  finishWorkout: (name?: string, gymLocation?: string) => StoredWorkout;
  cancelWorkout: () => void;
  hasPendingWorkout: boolean;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [workout, setWorkoutState] = useState<StoredWorkout | null>(null);
  const [hasPendingWorkout, setHasPendingWorkout] = useState(false);
  const [todayRestDayState, setTodayRestDayState] = useState<TodayRestDay | null>(null);

  // Mirrors `workout` so mutations read the freshest value rather than the one
  // captured at render time. Two mutations fired from the same event (e.g.
  // auto-add-set: updateSet followed by addSet) must compose — reading state
  // directly would make the second one clobber the first, dropping the
  // keystroke the user just typed.
  const workoutRef = useRef<StoredWorkout | null>(null);

  const setWorkout = useCallback((w: StoredWorkout | null) => {
    workoutRef.current = w;
    setWorkoutState(w);
  }, []);

  // Load current workout on mount (MMKV is synchronous)
  useEffect(() => {
    const current = getCurrentWorkout();
    const pending = getPendingWorkout();

    setHasPendingWorkout(pending !== null);

    if (current) {
      const settings = getSettings();
      const startTime = new Date(current.startTime);
      const now = new Date();
      const minutesDiff = (now.getTime() - startTime.getTime()) / (1000 * 60);

      if (minutesDiff > settings.maxWorkoutDurationMinutes) {
        // Auto-cap the workout
        const cappedEndTime = new Date(
          startTime.getTime() + settings.maxWorkoutDurationMinutes * 60 * 1000,
        );
        const cappedWorkout = {
          ...current,
          endTime: cappedEndTime.toISOString(),
        };
        setPendingWorkout(cappedWorkout);
        setCurrentWorkout(null);
        setHasPendingWorkout(true);
      } else {
        setWorkout(current);
      }
    }

    // Load today's rest day from storage
    const storedRestDay = getTodayRestDay();
    if (storedRestDay && storedRestDay.date === getLocalDateString()) {
      setTodayRestDayState(storedRestDay);
    } else if (storedRestDay) {
      clearTodayRestDay(); // Stale — different day
    }
  }, []);

  const saveWorkout = useCallback(
    (w: StoredWorkout | null) => {
      setWorkout(w);
      setCurrentWorkout(w);
    },
    [setWorkout],
  );

  // Applies a pure mutation to the latest workout. Using the ref (not the
  // render-time `workout`) keeps back-to-back mutations from clobbering
  // each other.
  const apply = useCallback(
    (fn: (w: StoredWorkout) => StoredWorkout) => {
      const current = workoutRef.current;
      if (!current) return;
      saveWorkout(fn(current));
    },
    [saveWorkout],
  );

  const startWorkout = useCallback(() => {
    if (todayRestDayState) return; // Can't start workout on a rest day

    const settings = getSettings();
    const newWorkout: StoredWorkout = {
      id: generateId(),
      startTime: new Date().toISOString(),
      exercises: [],
      privacy: settings.defaultPrivacy,
      kind: "workout",
    };
    saveWorkout(newWorkout);

    // Auto-detect nearby gym (fire-and-forget)
    detectAndSetNearbyGym().catch(() => {});
  }, [saveWorkout, todayRestDayState]);

  const logRestDay = useCallback((): StoredWorkout | null => {
    if (todayRestDayState) return null; // Already a rest day today

    const settings = getSettings();
    const now = new Date().toISOString();
    const restDay: StoredWorkout = {
      id: generateId(),
      startTime: now,
      exercises: [],
      privacy: settings.defaultPrivacy,
      kind: "rest",
      name: "Rest Day",
    };

    const pointer: TodayRestDay = {
      workoutId: restDay.id,
      date: getLocalDateString(),
      startTime: now,
    };
    setTodayRestDay(pointer);
    setTodayRestDayState(pointer);

    setPendingWorkout(restDay);
    setHasPendingWorkout(true);

    return restDay;
  }, [todayRestDayState]);

  const cancelRestDay = useCallback((): string | undefined => {
    const current = getTodayRestDay();
    const syncedId = current?.syncedWorkoutId;

    clearTodayRestDay();
    setTodayRestDayState(null);

    // Clear pending if not yet synced
    const pending = getPendingWorkout();
    if (pending && pending.kind === "rest") {
      setPendingWorkout(null);
      setHasPendingWorkout(false);
    }

    return syncedId;
  }, []);

  const reconcileRestDay = useCallback((serverWorkouts: any[]) => {
    const today = getLocalDateString();
    const serverRestDay = serverWorkouts.find((w: any) => {
      return getLocalDateString(w.startTime) === today && w.kind === "rest";
    });

    const local = getTodayRestDay();

    if (serverRestDay && !local) {
      // Server has rest day, local doesn't — adopt (logged on another device)
      const pointer: TodayRestDay = {
        workoutId: serverRestDay.id,
        date: today,
        startTime: serverRestDay.startTime,
        syncedWorkoutId: serverRestDay.id,
      };
      setTodayRestDay(pointer);
      setTodayRestDayState(pointer);
    } else if (local && serverRestDay && !local.syncedWorkoutId) {
      // Local was pending, server now has it — update with server ID
      const updated: TodayRestDay = {
        ...local,
        syncedWorkoutId: serverRestDay.id,
      };
      setTodayRestDay(updated);
      setTodayRestDayState(updated);
    } else if (
      local &&
      serverRestDay &&
      local.syncedWorkoutId &&
      local.syncedWorkoutId !== serverRestDay.id
    ) {
      // Both exist with different IDs (e.g., re-created from another device) — server wins
      const pointer: TodayRestDay = {
        workoutId: serverRestDay.id,
        date: today,
        startTime: serverRestDay.startTime,
        syncedWorkoutId: serverRestDay.id,
      };
      setTodayRestDay(pointer);
      setTodayRestDayState(pointer);
    }
    // If local has rest day but server doesn't → still pending sync, keep local
    // If neither has rest day → nothing to do
  }, []);

  const addExercise = useCallback(
    (exerciseId: string, exerciseName: string, profileId?: string, exerciseType?: string) => {
      apply((w) => addExerciseMutation(w, exerciseId, exerciseName, profileId, exerciseType));
    },
    [apply],
  );

  const removeExercise = useCallback(
    (exerciseId: string) => {
      apply((w) => removeExerciseMutation(w, exerciseId));
    },
    [apply],
  );

  const reorderExercises = useCallback(
    (newOrder: string[]) => {
      apply((w) => reorderExercisesMutation(w, newOrder));
    },
    [apply],
  );

  const addSet = useCallback(
    (exerciseId: string, weightUnit: string, reps?: number, weight?: number, side?: "L" | "R") => {
      apply((w) => addSetMutation(w, exerciseId, weightUnit, reps, weight, side));
    },
    [apply],
  );

  const addUnilateralPair = useCallback(
    (exerciseId: string, weightUnit: string, reps?: number, weight?: number) => {
      apply((w) => addUnilateralPairMutation(w, exerciseId, weightUnit, reps, weight));
    },
    [apply],
  );

  const toggleUnilateral = useCallback(
    (exerciseId: string) => {
      apply((w) => toggleUnilateralMutation(w, exerciseId));
    },
    [apply],
  );

  const changeExerciseProfile = useCallback(
    (exerciseId: string, profileId: string | undefined, exerciseName: string) => {
      apply((w) => changeExerciseProfileMutation(w, exerciseId, profileId, exerciseName));
    },
    [apply],
  );

  const updateSet = useCallback(
    (exerciseId: string, setId: string, updates: Partial<StoredSet>) => {
      apply((w) => updateSetMutation(w, exerciseId, setId, updates));
    },
    [apply],
  );

  const removeSet = useCallback(
    (exerciseId: string, setId: string) => {
      apply((w) => removeSetMutation(w, exerciseId, setId));
    },
    [apply],
  );

  const removeLastSet = useCallback(
    (exerciseId: string) => {
      apply((w) => removeLastSetMutation(w, exerciseId));
    },
    [apply],
  );

  const removeLastUnilateralPair = useCallback(
    (exerciseId: string) => {
      apply((w) => removeLastUnilateralPairMutation(w, exerciseId));
    },
    [apply],
  );

  const trimTrailingEmptySets = useCallback(
    (exerciseId: string, keepCount: number = 0) => {
      apply((w) => trimTrailingEmptySetsMutation(w, exerciseId, keepCount));
    },
    [apply],
  );

  const finishWorkout = useCallback(
    (name?: string, gymLocation?: string): StoredWorkout => {
      const current = workoutRef.current;
      if (!current) throw new Error("No active workout");

      // Remove empty sets before saving
      const finishedWorkout: StoredWorkout = {
        ...current,
        name,
        gymLocation,
        endTime: new Date().toISOString(),
        exercises: current.exercises.map((e) => ({
          ...e,
          sets: e.sets.filter((s) => s.reps != null && s.reps > 0),
        })),
      };

      // Save previous sets for each exercise
      for (const exercise of finishedWorkout.exercises) {
        updatePreviousSets(exercise.exerciseId, exercise.profileId ?? null, exercise.sets);
      }

      // Save exercise sequence
      const sequence = finishedWorkout.exercises.map((e) => e.exerciseId);
      addExerciseSequence(sequence, name);

      // Mark as pending sync
      setPendingWorkout(finishedWorkout);
      setCurrentWorkout(null);
      setWorkout(null);
      setHasPendingWorkout(true);

      return finishedWorkout;
    },
    [setWorkout],
  );

  const cancelWorkout = useCallback(() => {
    setCurrentWorkout(null);
    setWorkout(null);
  }, [setWorkout]);

  return (
    <WorkoutContext.Provider
      value={{
        workout,
        isActive: workout !== null,
        todayRestDay: todayRestDayState,
        startWorkout,
        logRestDay,
        cancelRestDay,
        reconcileRestDay,
        addExercise,
        removeExercise,
        reorderExercises,
        addSet,
        addUnilateralPair,
        updateSet,
        removeSet,
        removeLastSet,
        removeLastUnilateralPair,
        trimTrailingEmptySets,
        toggleUnilateral,
        changeExerciseProfile,
        finishWorkout,
        cancelWorkout,
        hasPendingWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}
