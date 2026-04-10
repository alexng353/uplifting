import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
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
  type StoredWorkoutExercise,
  type TodayRestDay,
  setCurrentWorkout,
  setPendingWorkout,
  updatePreviousSets,
} from "../services/storage";

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
  updateSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<StoredSet>,
  ) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  removeLastSet: (exerciseId: string) => void;
  removeLastUnilateralPair: (exerciseId: string) => void;
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
  const [workout, setWorkout] = useState<StoredWorkout | null>(null);
  const [hasPendingWorkout, setHasPendingWorkout] = useState(false);
  const [todayRestDayState, setTodayRestDayState] =
    useState<TodayRestDay | null>(null);

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

  const saveWorkout = useCallback((w: StoredWorkout | null) => {
    setWorkout(w);
    setCurrentWorkout(w);
  }, []);

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
    (
      exerciseId: string,
      exerciseName: string,
      profileId?: string,
      exerciseType?: string,
    ) => {
      if (!workout) return;

      const settings = getSettings();
      const unit = settings.displayUnit ?? "kg";

      const firstSet: StoredSet = {
        id: generateId(),
        weightUnit: unit,
        createdAt: new Date().toISOString(),
        bodyweight:
          exerciseType === "Bodyweight"
            ? (settings.bodyweight ?? undefined)
            : undefined,
      };

      const newExercise: StoredWorkoutExercise = {
        exerciseId,
        exerciseName,
        exerciseType,
        profileId,
        sets: [firstSet],
      };

      const updated = {
        ...workout,
        exercises: [...workout.exercises, newExercise],
      };
      saveWorkout(updated);
    },
    [workout, saveWorkout],
  );

  const removeExercise = useCallback(
    (exerciseId: string) => {
      if (!workout) return;

      const updated = {
        ...workout,
        exercises: workout.exercises.filter((e) => e.exerciseId !== exerciseId),
      };
      saveWorkout(updated);
    },
    [workout, saveWorkout],
  );

  const reorderExercises = useCallback(
    (newOrder: string[]) => {
      if (!workout) return;

      const exerciseMap = new Map(
        workout.exercises.map((e) => [e.exerciseId, e]),
      );
      const reordered = newOrder
        .map((id) => exerciseMap.get(id))
        .filter((e): e is StoredWorkoutExercise => e !== undefined);

      const updated = { ...workout, exercises: reordered };
      saveWorkout(updated);
    },
    [workout, saveWorkout],
  );

  const getBodyweightForExercise = useCallback(
    (exerciseId: string): number | undefined => {
      if (!workout) return undefined;
      const exercise = workout.exercises.find(
        (e) => e.exerciseId === exerciseId,
      );
      if (exercise?.exerciseType !== "Bodyweight") return undefined;
      const settings = getSettings();
      return settings.bodyweight ?? undefined;
    },
    [workout],
  );

  const addSet = useCallback(
    (
      exerciseId: string,
      weightUnit: string,
      reps?: number,
      weight?: number,
      side?: "L" | "R",
    ) => {
      if (!workout) return;

      const bodyweight = getBodyweightForExercise(exerciseId);
      const newSet: StoredSet = {
        id: generateId(),
        reps,
        weight,
        weightUnit,
        createdAt: new Date().toISOString(),
        side,
        bodyweight,
      };

      const updated = {
        ...workout,
        exercises: workout.exercises.map((e) =>
          e.exerciseId === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e,
        ),
      };
      saveWorkout(updated);
    },
    [workout, saveWorkout, getBodyweightForExercise],
  );

  const addUnilateralPair = useCallback(
    (
      exerciseId: string,
      weightUnit: string,
      reps?: number,
      weight?: number,
    ) => {
      if (!workout) return;

      const bodyweight = getBodyweightForExercise(exerciseId);
      const rightSet: StoredSet = {
        id: generateId(),
        reps,
        weight,
        weightUnit,
        createdAt: new Date().toISOString(),
        side: "R",
        bodyweight,
      };

      const leftSet: StoredSet = {
        id: generateId(),
        reps,
        weight,
        weightUnit,
        createdAt: new Date().toISOString(),
        side: "L",
        bodyweight,
      };

      const updated = {
        ...workout,
        exercises: workout.exercises.map((e) =>
          e.exerciseId === exerciseId
            ? { ...e, sets: [...e.sets, rightSet, leftSet] }
            : e,
        ),
      };
      saveWorkout(updated);
    },
    [workout, saveWorkout, getBodyweightForExercise],
  );

  const toggleUnilateral = useCallback(
    (exerciseId: string) => {
      if (!workout) return;

      const updated = {
        ...workout,
        exercises: workout.exercises.map((e) => {
          if (e.exerciseId !== exerciseId) {
            return e;
          }

          const isCurrentlyUnilateral = e.isUnilateral ?? false;

          if (!isCurrentlyUnilateral) {
            const expandedSets = e.sets.flatMap((set) => {
              if (set.side) {
                return [set];
              }

              const rightSet: StoredSet = { ...set, side: "R" };
              const leftSet: StoredSet = {
                ...set,
                id: generateId(),
                side: "L",
              };
              return [rightSet, leftSet];
            });

            return { ...e, isUnilateral: true, sets: expandedSets };
          }

          const rightSets = e.sets.filter(
            (set) => set.side === "R" || !set.side,
          );
          const leftSets = e.sets.filter((set) => set.side === "L");
          const maxLen = Math.max(rightSets.length, leftSets.length);
          const mergedSets: StoredSet[] = [];

          for (let i = 0; i < maxLen; i += 1) {
            const rightSet = rightSets[i];
            const leftSet = leftSets[i];

            if (!rightSet && !leftSet) continue;

            const baseSet = rightSet ?? leftSet;
            if (!baseSet) continue;

            mergedSets.push({
              id: rightSet?.id ?? leftSet?.id ?? generateId(),
              reps: rightSet?.reps ?? leftSet?.reps,
              weight: rightSet?.weight ?? leftSet?.weight,
              weightUnit:
                rightSet?.weightUnit ??
                leftSet?.weightUnit ??
                baseSet.weightUnit,
              createdAt:
                rightSet?.createdAt ?? leftSet?.createdAt ?? baseSet.createdAt,
            });
          }

          return { ...e, isUnilateral: false, sets: mergedSets };
        }),
      };
      saveWorkout(updated);
    },
    [workout, saveWorkout],
  );

  const changeExerciseProfile = useCallback(
    (
      exerciseId: string,
      profileId: string | undefined,
      exerciseName: string,
    ) => {
      if (!workout) return;

      const updated = {
        ...workout,
        exercises: workout.exercises.map((e) =>
          e.exerciseId === exerciseId ? { ...e, profileId, exerciseName } : e,
        ),
      };
      saveWorkout(updated);
    },
    [workout, saveWorkout],
  );

  const updateSet = useCallback(
    (exerciseId: string, setId: string, updates: Partial<StoredSet>) => {
      if (!workout) return;

      const updated = {
        ...workout,
        exercises: workout.exercises.map((e) =>
          e.exerciseId === exerciseId
            ? {
                ...e,
                sets: e.sets.map((s) =>
                  s.id === setId ? { ...s, ...updates } : s,
                ),
              }
            : e,
        ),
      };
      saveWorkout(updated);
    },
    [workout, saveWorkout],
  );

  const removeSet = useCallback(
    (exerciseId: string, setId: string) => {
      if (!workout) return;

      const updated = {
        ...workout,
        exercises: workout.exercises.map((e) =>
          e.exerciseId === exerciseId
            ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
            : e,
        ),
      };
      saveWorkout(updated);
    },
    [workout, saveWorkout],
  );

  const removeLastSet = useCallback(
    (exerciseId: string) => {
      if (!workout) return;

      const updated = {
        ...workout,
        exercises: workout.exercises.map((e) =>
          e.exerciseId === exerciseId ? { ...e, sets: e.sets.slice(0, -1) } : e,
        ),
      };
      saveWorkout(updated);
    },
    [workout, saveWorkout],
  );

  const removeLastUnilateralPair = useCallback(
    (exerciseId: string) => {
      if (!workout) return;

      const exercise = workout.exercises.find(
        (e) => e.exerciseId === exerciseId,
      );
      if (!exercise) return;

      const rightSets = exercise.sets.filter((s) => s.side === "R");
      const leftSets = exercise.sets.filter((s) => s.side === "L");
      const lastRight = rightSets[rightSets.length - 1];
      const lastLeft = leftSets[leftSets.length - 1];

      const idsToRemove = new Set<string>();
      if (lastRight) idsToRemove.add(lastRight.id);
      if (lastLeft) idsToRemove.add(lastLeft.id);

      const updated = {
        ...workout,
        exercises: workout.exercises.map((e) =>
          e.exerciseId === exerciseId
            ? { ...e, sets: e.sets.filter((s) => !idsToRemove.has(s.id)) }
            : e,
        ),
      };
      saveWorkout(updated);
    },
    [workout, saveWorkout],
  );

  const finishWorkout = useCallback(
    (name?: string, gymLocation?: string): StoredWorkout => {
      if (!workout) throw new Error("No active workout");

      // Remove empty sets before saving
      const finishedWorkout: StoredWorkout = {
        ...workout,
        name,
        gymLocation,
        endTime: new Date().toISOString(),
        exercises: workout.exercises.map((e) => ({
          ...e,
          sets: e.sets.filter((s) => s.reps != null && s.reps > 0),
        })),
      };

      // Save previous sets for each exercise
      for (const exercise of finishedWorkout.exercises) {
        updatePreviousSets(
          exercise.exerciseId,
          exercise.profileId ?? null,
          exercise.sets,
        );
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
    [workout],
  );

  const cancelWorkout = useCallback(() => {
    setCurrentWorkout(null);
    setWorkout(null);
  }, []);

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
