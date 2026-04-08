import AsyncStorage from "@react-native-async-storage/async-storage";

// In-memory cache for synchronous reads, persisted to AsyncStorage
const cache = new Map<string, string>();
let hydrated = false;

// Hydrate cache from AsyncStorage on startup
export async function hydrateStorage(): Promise<void> {
  if (hydrated) return;
  const keys = await AsyncStorage.getAllKeys();
  if (keys.length > 0) {
    const entries = await AsyncStorage.multiGet(keys);
    for (const [key, value] of entries) {
      if (key && value) cache.set(key, value);
    }
  }
  hydrated = true;
}

const storage = {
  getString(key: string): string | undefined {
    return cache.get(key);
  },
  set(key: string, value: string): void {
    cache.set(key, value);
    AsyncStorage.setItem(key, value);
  },
  delete(key: string): void {
    cache.delete(key);
    AsyncStorage.removeItem(key);
  },
  clearAll(): void {
    cache.clear();
    AsyncStorage.clear();
  },
};

// Storage keys
export const STORAGE_KEYS = {
  CURRENT_WORKOUT: "current_workout",
  SETTINGS: "settings",
  EXERCISES: "exercises",
  PREVIOUS_SETS: "previous_sets",
  PROFILES: "profiles",
  LAST_SYNC: "last_sync",
  PENDING_WORKOUT: "pending_workout",
  WORKOUT_LAST_SLIDE: "workout_last_slide",
  GYMS: "gyms",
  CURRENT_GYM: "current_gym",
  GYM_PROFILE_MAP: "gym_profile_map",
  EXERCISE_SEQUENCES: "exercise_sequences",
} as const;

// Workout kind type
export type WorkoutKind = "workout" | "rest";

// Types for stored data
export interface StoredWorkout {
  id: string;
  startTime: string;
  endTime?: string;
  exercises: StoredWorkoutExercise[];
  name?: string;
  privacy: string;
  gymLocation?: string;
  kind: WorkoutKind;
}

export interface StoredWorkoutLastSlide {
  workoutId: string;
  slideIndex: number;
}

export interface StoredWorkoutExercise {
  exerciseId: string;
  profileId?: string;
  exerciseName: string;
  exerciseType?: string;
  sets: StoredSet[];
  isUnilateral?: boolean;
}

export interface StoredSet {
  id: string;
  reps?: number;
  weight?: number;
  weightUnit: string;
  createdAt: string;
  side?: "L" | "R";
  bodyweight?: number;
}

export interface RepRangeConfig {
  label: string;
  min: number;
  max: number;
  color: string;
}

export const DEFAULT_REP_RANGES: RepRangeConfig[] = [
  { label: "1 rep", min: 1, max: 1, color: "#ef4444" },
  { label: "2-5 reps", min: 2, max: 5, color: "#f97316" },
  { label: "6-8 reps", min: 6, max: 8, color: "#3b82f6" },
  { label: "9-12 reps", min: 9, max: 12, color: "#22c55e" },
  { label: "12+ reps", min: 13, max: 9999, color: "#ffffff" },
];

export interface StoredSettings {
  displayUnit: "kg" | "lbs" | null;
  maxWorkoutDurationMinutes: number;
  defaultRestTimerSeconds: number;
  defaultPrivacy: string;
  shareGymLocation: boolean;
  // Sharing settings
  shareOnlineStatus: boolean;
  shareWorkoutStatus: boolean;
  shareWorkoutHistory: boolean;
  // Current gym
  currentGymId: string | null;
  // Workout behavior
  autoAddSet: boolean;
  autoRemoveEmptySet: boolean;
  // Body
  bodyweight: number | null;
  // Chart rep range colors
  repRanges: RepRangeConfig[] | null;
  // Appearance
  colorScheme: "light" | "dark" | "system";
}

export interface StoredPreviousSets {
  [key: string]: StoredSet[]; // key = `${exerciseId}_${profileId || 'default'}`
}

export interface StoredProfile {
  id: string;
  exerciseId: string;
  name: string;
}

export interface StoredExercise {
  id: string;
  name: string;
  exerciseType: string;
  official: boolean;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

export interface StoredGym {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface GymProfileMapping {
  [key: string]: string; // key: `${exerciseId}_${gymId}`, value: profileId
}

// Exercise sequence from a past workout, paired with its title
export interface ExerciseSequenceEntry {
  exerciseIds: string[];
  title?: string;
}

// Stored exercise sequences from recent workouts (most recent first, max 20)
export type StoredExerciseSequences = ExerciseSequenceEntry[];

// Default settings
export const DEFAULT_SETTINGS: StoredSettings = {
  displayUnit: null,
  maxWorkoutDurationMinutes: 120,
  defaultRestTimerSeconds: 90,
  defaultPrivacy: "friends",
  shareGymLocation: true,
  shareOnlineStatus: true,
  shareWorkoutStatus: true,
  shareWorkoutHistory: true,
  currentGymId: null,
  autoAddSet: true,
  autoRemoveEmptySet: true,
  bodyweight: null,
  repRanges: null,
  colorScheme: "system",
};

// --- Internal helpers ---

function getJSON<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (raw === undefined) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

function deleteKey(key: string): void {
  storage.delete(key);
}

// --- Storage operations (all synchronous) ---

export function getCurrentWorkout(): StoredWorkout | null {
  return getJSON<StoredWorkout>(STORAGE_KEYS.CURRENT_WORKOUT);
}

export function setCurrentWorkout(workout: StoredWorkout | null): void {
  if (workout === null) {
    deleteKey(STORAGE_KEYS.CURRENT_WORKOUT);
  } else {
    setJSON(STORAGE_KEYS.CURRENT_WORKOUT, workout);
  }
}

export function getWorkoutLastSlide(): StoredWorkoutLastSlide | null {
  return getJSON<StoredWorkoutLastSlide>(STORAGE_KEYS.WORKOUT_LAST_SLIDE);
}

export function setWorkoutLastSlide(
  workoutId: string,
  slideIndex: number,
): void {
  setJSON(STORAGE_KEYS.WORKOUT_LAST_SLIDE, { workoutId, slideIndex });
}

export function clearWorkoutLastSlide(): void {
  deleteKey(STORAGE_KEYS.WORKOUT_LAST_SLIDE);
}

export function getSettings(): StoredSettings {
  return getJSON<StoredSettings>(STORAGE_KEYS.SETTINGS) ?? DEFAULT_SETTINGS;
}

export function setSettings(settings: StoredSettings): void {
  setJSON(STORAGE_KEYS.SETTINGS, settings);
}

export function getExercises(): StoredExercise[] {
  return getJSON<StoredExercise[]>(STORAGE_KEYS.EXERCISES) ?? [];
}

export function setExercises(exercises: StoredExercise[]): void {
  setJSON(STORAGE_KEYS.EXERCISES, exercises);
}

export function getPreviousSets(): StoredPreviousSets {
  return getJSON<StoredPreviousSets>(STORAGE_KEYS.PREVIOUS_SETS) ?? {};
}

export function setPreviousSets(data: StoredPreviousSets): void {
  setJSON(STORAGE_KEYS.PREVIOUS_SETS, data);
}

export function updatePreviousSets(
  exerciseId: string,
  profileId: string | null,
  sets: StoredSet[],
): void {
  const key = `${exerciseId}_${profileId ?? "default"}`;
  const current = getPreviousSets();
  current[key] = sets;
  setPreviousSets(current);
}

export function getProfiles(): StoredProfile[] {
  return getJSON<StoredProfile[]>(STORAGE_KEYS.PROFILES) ?? [];
}

export function setProfiles(profiles: StoredProfile[]): void {
  setJSON(STORAGE_KEYS.PROFILES, profiles);
}

export function getLastSyncTime(): Date | null {
  const raw = storage.getString(STORAGE_KEYS.LAST_SYNC);
  return raw ? new Date(raw) : null;
}

export function setLastSyncTime(date: Date): void {
  storage.set(STORAGE_KEYS.LAST_SYNC, date.toISOString());
}

export function getPendingWorkout(): StoredWorkout | null {
  return getJSON<StoredWorkout>(STORAGE_KEYS.PENDING_WORKOUT);
}

export function setPendingWorkout(workout: StoredWorkout | null): void {
  if (workout === null) {
    deleteKey(STORAGE_KEYS.PENDING_WORKOUT);
  } else {
    setJSON(STORAGE_KEYS.PENDING_WORKOUT, workout);
  }
}

export function clearAllData(): void {
  storage.clearAll();
}

// Helper to generate unique IDs
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper for weight conversion (display only)
export function convertWeight(
  weight: number,
  fromUnit: string,
  toUnit: string,
): number {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === "kg" && toUnit === "lbs") {
    return Math.round(weight * 2.20462 * 10) / 10;
  }
  if (fromUnit === "lbs" && toUnit === "kg") {
    return Math.round((weight / 2.20462) * 10) / 10;
  }
  return weight;
}

// --- Gym operations ---

export function getGyms(): StoredGym[] {
  return getJSON<StoredGym[]>(STORAGE_KEYS.GYMS) ?? [];
}

export function setGyms(gyms: StoredGym[]): void {
  setJSON(STORAGE_KEYS.GYMS, gyms);
}

export function addGym(
  name: string,
  latitude?: number | null,
  longitude?: number | null,
): StoredGym {
  const gyms = getGyms();
  const newGym: StoredGym = {
    id: generateId(),
    name,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    createdAt: new Date().toISOString(),
  };
  gyms.push(newGym);
  setGyms(gyms);
  return newGym;
}

export function updateGym(id: string, name: string): void {
  const gyms = getGyms();
  const index = gyms.findIndex((g) => g.id === id);
  if (index !== -1) {
    gyms[index].name = name;
    setGyms(gyms);
  }
}

export function deleteGym(id: string): void {
  const gyms = getGyms();
  const filtered = gyms.filter((g) => g.id !== id);
  setGyms(filtered);

  // Clear current gym if it was deleted
  const currentGymId = getCurrentGymId();
  if (currentGymId === id) {
    setCurrentGymId(null);
  }
}

// --- Current gym operations ---

export function getCurrentGymId(): string | null {
  return storage.getString(STORAGE_KEYS.CURRENT_GYM) ?? null;
}

export function setCurrentGymId(gymId: string | null): void {
  if (gymId === null) {
    deleteKey(STORAGE_KEYS.CURRENT_GYM);
  } else {
    storage.set(STORAGE_KEYS.CURRENT_GYM, gymId);
  }
}

// --- Gym profile mapping operations ---

export function getGymProfileMap(): GymProfileMapping {
  return getJSON<GymProfileMapping>(STORAGE_KEYS.GYM_PROFILE_MAP) ?? {};
}

export function setGymProfileMap(map: GymProfileMapping): void {
  setJSON(STORAGE_KEYS.GYM_PROFILE_MAP, map);
}

export function setGymProfileForExercise(
  exerciseId: string,
  gymId: string,
  profileId: string,
): void {
  const map = getGymProfileMap();
  const key = `${exerciseId}_${gymId}`;
  map[key] = profileId;
  setJSON(STORAGE_KEYS.GYM_PROFILE_MAP, map);
}

// --- Exercise sequence operations ---

const MAX_EXERCISE_SEQUENCES = 20;

export function getExerciseSequences(): StoredExerciseSequences {
  const raw = getJSON<StoredExerciseSequences | string[][]>(
    STORAGE_KEYS.EXERCISE_SEQUENCES,
  );
  if (!raw || raw.length === 0) return [];
  // Migrate old format (string[][]) to new format (ExerciseSequenceEntry[])
  if (Array.isArray(raw[0])) {
    return (raw as string[][]).map((ids) => ({ exerciseIds: ids }));
  }
  return raw as StoredExerciseSequences;
}

export function addExerciseSequence(
  sequence: string[],
  title?: string,
): void {
  if (sequence.length === 0) return;
  const sequences = getExerciseSequences();
  sequences.unshift({ exerciseIds: sequence, title });
  // Keep only the most recent N sequences
  if (sequences.length > MAX_EXERCISE_SEQUENCES) {
    sequences.length = MAX_EXERCISE_SEQUENCES;
  }
  setJSON(STORAGE_KEYS.EXERCISE_SEQUENCES, sequences);
}

export function getLastProfileForExerciseAtGym(
  exerciseId: string,
  gymId: string,
): string | null {
  const map = getGymProfileMap();
  const key = `${exerciseId}_${gymId}`;
  return map[key] ?? null;
}
