import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { detectAndSetNearbyGym } from "../services/geolocation";
import { recordGymCheckin } from "../services/gym-checkins";
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
  recordExerciseSetCount,
  getPreviousSets,
  getSetCounts,
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
  setRowModeMutation,
  changeExerciseProfileMutation,
  trimTrailingEmptySetsMutation,
} from "../lib/workout-mutations";
import {
  beginHealthForWorkout,
  discardHealthForWorkout,
  finishHealthForWorkout,
  resumeHealthForWorkout,
} from "../services/live-workout";
import { clearRest, startRest } from "../services/rest-timer";
import { isSetDone } from "../lib/live-activity";
import { detectSupersets, nextInRound, pairKey } from "../lib/supersets";
import { targetSetCount } from "../lib/target-sets";
import { previousFor, withWarmupFlags } from "../lib/warmup-apply";
import type { SideMode } from "../lib/set-rows";

interface WorkoutContextValue {
  workout: StoredWorkout | null;
  isActive: boolean;
  todayRestDay: TodayRestDay | null;
  startWorkout: (day?: { id: string; name: string }) => StoredWorkout | null;
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
    autoAdded?: boolean,
    extra?: Partial<StoredSet>,
  ) => void;
  addUnilateralPair: (
    exerciseId: string,
    weightUnit: string,
    reps?: number,
    weight?: number,
    layout?: "combined",
    autoAdded?: boolean,
  ) => void;
  updateSet: (exerciseId: string, setId: string, updates: Partial<StoredSet>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  removeLastSet: (exerciseId: string) => void;
  removeLastUnilateralPair: (exerciseId: string) => void;
  trimTrailingEmptySets: (exerciseId: string, keepCount?: number) => void;
  toggleUnilateral: (exerciseId: string) => void;
  setRowMode: (exerciseId: string, rowIndex: number, mode: SideMode) => void;
  changeExerciseProfile: (
    exerciseId: string,
    profileId: string | undefined,
    exerciseName: string,
  ) => void;
  finishWorkout: (name?: string, gymLocation?: string) => StoredWorkout;
  cancelWorkout: () => void;
  /** "Not a superset": these two never group again in this workout. */
  markNotSuperset: (a: string, b: string) => void;
  hasPendingWorkout: boolean;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

/** Live superset groups; an exercise at its usual set count counts as finished. */
export function supersetGroups(w: StoredWorkout): string[][] {
  const counts = getSetCounts();
  const previous = getPreviousSets();
  const profileOf = new Map(w.exercises.map((e) => [e.exerciseId, e.profileId]));
  return detectSupersets(w.exercises, {
    dismissed: w.notSupersets,
    finished: (id, doneRows) => {
      const target = targetSetCount(counts, previous, id, profileOf.get(id));
      return target != null && doneRows >= target;
    },
  });
}

function mergeGroups(saved: string[][] | undefined, groups: string[][]): string[][] {
  const out = [...(saved ?? [])];
  for (const g of groups) {
    const i = out.findIndex((o) => o.some((id) => g.includes(id)));
    if (i < 0) out.push(g);
    else out[i] = [...new Set([...out[i], ...g])];
  }
  return out;
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [workout, setWorkout] = useState<StoredWorkout | null>(null);
  const [hasPendingWorkout, setHasPendingWorkout] = useState(false);
  const [todayRestDayState, setTodayRestDayState] = useState<TodayRestDay | null>(null);

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
        finishHealthForWorkout(cappedWorkout).catch(() => {});
      } else {
        setWorkout(current);
        // A killed app left the Health session running (or it needs starting again).
        resumeHealthForWorkout(current).catch(() => {});
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

  const startWorkout = useCallback(
    (day?: { id: string; name: string }) => {
      if (todayRestDayState) return null; // Can't start workout on a rest day

      const settings = getSettings();
      const newWorkout: StoredWorkout = {
        id: generateId(),
        startTime: new Date().toISOString(),
        exercises: [],
        privacy: settings.defaultPrivacy,
        kind: "workout",
        // The day sets the title (shown on the Live Activity and prefilled at Finish).
        ...(day ? { dayTypeId: day.id, dayTypeName: day.name, name: day.name } : null),
      };
      saveWorkout(newWorkout);

      // Auto-detect nearby gym (fire-and-forget)
      detectAndSetNearbyGym().catch(() => {});
      // Where Start was tapped, for Alex's gym gate (fire-and-forget, queued offline).
      recordGymCheckin(newWorkout.id, "start", newWorkout.startTime);
      // Live Fitness session; the first Start asks for Health access once.
      beginHealthForWorkout(newWorkout).catch(() => {});
      return newWorkout;
    },
    [saveWorkout, todayRestDayState],
  );

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
      // The synchronous cache, so "add the rest of the day" adds every exercise in one tap.
      const current = getCurrentWorkout() ?? workout;
      if (!current) return;
      saveWorkout(addExerciseMutation(current, exerciseId, exerciseName, profileId, exerciseType));
    },
    [workout, saveWorkout],
  );

  const removeExercise = useCallback(
    (exerciseId: string) => {
      if (!workout) return;
      saveWorkout(removeExerciseMutation(workout, exerciseId));
    },
    [workout, saveWorkout],
  );

  const reorderExercises = useCallback(
    (newOrder: string[]) => {
      if (!workout) return;
      saveWorkout(reorderExercisesMutation(workout, newOrder));
    },
    [workout, saveWorkout],
  );

  const addSet = useCallback(
    (
      exerciseId: string,
      weightUnit: string,
      reps?: number,
      weight?: number,
      side?: "L" | "R",
      autoAdded?: boolean,
      extra?: Partial<StoredSet>,
    ) => {
      // Auto-add follows updateSet in the same event, before React rerenders.
      const current = getCurrentWorkout();
      if (!current) return;
      saveWorkout(
        addSetMutation(current, exerciseId, weightUnit, reps, weight, side, autoAdded, extra),
      );
    },
    [saveWorkout],
  );

  const addUnilateralPair = useCallback(
    (
      exerciseId: string,
      weightUnit: string,
      reps?: number,
      weight?: number,
      layout?: "combined",
      autoAdded?: boolean,
    ) => {
      // Use the synchronous cache so auto-add includes the just-saved edit.
      const current = getCurrentWorkout();
      if (!current) return;
      saveWorkout(
        addUnilateralPairMutation(current, exerciseId, weightUnit, reps, weight, layout, autoAdded),
      );
    },
    [saveWorkout],
  );

  const toggleUnilateral = useCallback(
    (exerciseId: string) => {
      if (!workout) return;
      saveWorkout(toggleUnilateralMutation(workout, exerciseId));
    },
    [workout, saveWorkout],
  );

  const changeExerciseProfile = useCallback(
    (exerciseId: string, profileId: string | undefined, exerciseName: string) => {
      if (!workout) return;
      saveWorkout(changeExerciseProfileMutation(workout, exerciseId, profileId, exerciseName));
    },
    [workout, saveWorkout],
  );

  const updateSet = useCallback(
    (exerciseId: string, setId: string, updates: Partial<StoredSet>) => {
      // A combined L/R row writes both sides in one tap; read the synchronous cache so
      // the second write keeps the first.
      const current = getCurrentWorkout() ?? workout;
      if (!current) return;
      let next = updateSetMutation(current, exerciseId, setId, updates);
      const find = (w: StoredWorkout) =>
        w.exercises.find((e) => e.exerciseId === exerciseId)?.sets.find((s) => s.id === setId);
      const before = find(current);
      const after = find(next);
      const justDone = !!before && !!after && !isSetDone(before) && isSetDone(after);
      if (justDone) {
        // Log time orders sets across exercises, which is how supersets are found.
        next = updateSetMutation(next, exerciseId, setId, { doneAt: new Date().toISOString() });
        const groups = supersetGroups(next);
        if (groups.length) next = { ...next, supersets: mergeGroups(next.supersets, groups) };
      }
      saveWorkout(next);
      // The automatic rest timer starts when a set becomes done (accept, or both fields),
      // except mid-superset: then he goes straight to the next exercise, and the normal
      // rest comes once the round is done.
      if (justDone) {
        const group = supersetGroups(next).find((g) => g.includes(exerciseId));
        if (group && nextInRound(group, next.exercises, exerciseId)) clearRest();
        else startRest(getSettings().defaultRestTimerSeconds);
      }
    },
    [workout, saveWorkout],
  );

  const setRowMode = useCallback(
    (exerciseId: string, rowIndex: number, mode: SideMode) => {
      const current = getCurrentWorkout() ?? workout;
      if (!current) return;
      saveWorkout(setRowModeMutation(current, exerciseId, rowIndex, mode));
    },
    [workout, saveWorkout],
  );

  const removeSet = useCallback(
    (exerciseId: string, setId: string) => {
      if (!workout) return;
      saveWorkout(removeSetMutation(workout, exerciseId, setId));
    },
    [workout, saveWorkout],
  );

  const removeLastSet = useCallback(
    (exerciseId: string) => {
      if (!workout) return;
      saveWorkout(removeLastSetMutation(workout, exerciseId));
    },
    [workout, saveWorkout],
  );

  const removeLastUnilateralPair = useCallback(
    (exerciseId: string) => {
      if (!workout) return;
      saveWorkout(removeLastUnilateralPairMutation(workout, exerciseId));
    },
    [workout, saveWorkout],
  );

  const trimTrailingEmptySets = useCallback(
    (exerciseId: string, keepCount: number = 0) => {
      if (!workout) return;
      saveWorkout(trimTrailingEmptySetsMutation(workout, exerciseId, keepCount));
    },
    [workout, saveWorkout],
  );

  const finishWorkout = useCallback(
    (name?: string, gymLocation?: string): StoredWorkout => {
      if (!workout) throw new Error("No active workout");

      // Remove empty sets before saving; warmup rows are flagged with the final call.
      const previous = getPreviousSets();
      const finishedWorkout: StoredWorkout = {
        ...workout,
        name,
        gymLocation,
        endTime: new Date().toISOString(),
        exercises: workout.exercises.map((e) => {
          const sets = e.sets.filter((s) => s.reps != null && s.reps > 0);
          return {
            ...e,
            sets: withWarmupFlags({ ...e, sets }, previousFor(previous, e.exerciseId, e.profileId)),
          };
        }),
      };

      // Save previous sets for each exercise
      for (const exercise of finishedWorkout.exercises) {
        updatePreviousSets(exercise.exerciseId, exercise.profileId ?? null, exercise.sets);
        recordExerciseSetCount(exercise.exerciseId, exercise.profileId, exercise.sets);
      }

      // Save exercise sequence
      const sequence = finishedWorkout.exercises.map((e) => e.exerciseId);
      addExerciseSequence(sequence, name ?? finishedWorkout.dayTypeName);

      // Mark as pending sync
      setPendingWorkout(finishedWorkout);
      // Where Finish was tapped, for Alex's gym gate (fire-and-forget, queued offline).
      recordGymCheckin(finishedWorkout.id, "finish", finishedWorkout.endTime!);
      // Ends the live Fitness session and saves it to Health (fire-and-forget).
      finishHealthForWorkout(finishedWorkout).catch(() => {});
      clearRest();
      setCurrentWorkout(null);
      setWorkout(null);
      setHasPendingWorkout(true);

      return finishedWorkout;
    },
    [workout],
  );

  const cancelWorkout = useCallback(() => {
    discardHealthForWorkout().catch(() => {});
    clearRest();
    setCurrentWorkout(null);
    setWorkout(null);
  }, []);

  const markNotSuperset = useCallback(
    (a: string, b: string) => {
      const current = getCurrentWorkout() ?? workout;
      if (!current) return;
      const key = pairKey(a, b);
      saveWorkout({
        ...current,
        notSupersets: [...new Set([...(current.notSupersets ?? []), key])],
        supersets: (current.supersets ?? []).filter((g) => !(g.includes(a) && g.includes(b))),
      });
    },
    [workout, saveWorkout],
  );

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
        setRowMode,
        changeExerciseProfile,
        finishWorkout,
        cancelWorkout,
        markNotSuperset,
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

/** The live workout, or null outside a WorkoutProvider (tests, previews). */
export function useOptionalWorkout(): WorkoutContextValue | null {
  return useContext(WorkoutContext);
}
