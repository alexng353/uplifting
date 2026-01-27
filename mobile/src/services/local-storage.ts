import { clear, del, get, set } from "idb-keyval";

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
} as const;

// Workout kind type
export type WorkoutKind = "workout" | "rest";

// Types for stored data
export interface StoredWorkout {
	id: string;
	startTime: string;
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
}

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
};

// Storage operations
export async function getCurrentWorkout(): Promise<StoredWorkout | null> {
	return (await get<StoredWorkout>(STORAGE_KEYS.CURRENT_WORKOUT)) ?? null;
}

export async function setCurrentWorkout(
	workout: StoredWorkout | null,
): Promise<void> {
	if (workout === null) {
		await del(STORAGE_KEYS.CURRENT_WORKOUT);
	} else {
		await set(STORAGE_KEYS.CURRENT_WORKOUT, workout);
	}
}

export async function getWorkoutLastSlide(): Promise<StoredWorkoutLastSlide | null> {
	return (
		(await get<StoredWorkoutLastSlide>(STORAGE_KEYS.WORKOUT_LAST_SLIDE)) ?? null
	);
}

export async function setWorkoutLastSlide(
	workoutId: string,
	slideIndex: number,
): Promise<void> {
	await set(STORAGE_KEYS.WORKOUT_LAST_SLIDE, { workoutId, slideIndex });
}

export async function clearWorkoutLastSlide(): Promise<void> {
	await del(STORAGE_KEYS.WORKOUT_LAST_SLIDE);
}

export async function getSettings(): Promise<StoredSettings> {
	return (await get<StoredSettings>(STORAGE_KEYS.SETTINGS)) ?? DEFAULT_SETTINGS;
}

export async function setSettings(settings: StoredSettings): Promise<void> {
	await set(STORAGE_KEYS.SETTINGS, settings);
}

export async function getExercises(): Promise<StoredExercise[]> {
	return (await get<StoredExercise[]>(STORAGE_KEYS.EXERCISES)) ?? [];
}

export async function setExercises(exercises: StoredExercise[]): Promise<void> {
	await set(STORAGE_KEYS.EXERCISES, exercises);
}

export async function getPreviousSets(): Promise<StoredPreviousSets> {
	return (await get<StoredPreviousSets>(STORAGE_KEYS.PREVIOUS_SETS)) ?? {};
}

export async function setPreviousSets(data: StoredPreviousSets): Promise<void> {
	await set(STORAGE_KEYS.PREVIOUS_SETS, data);
}

export async function updatePreviousSets(
	exerciseId: string,
	profileId: string | null,
	sets: StoredSet[],
): Promise<void> {
	const key = `${exerciseId}_${profileId ?? "default"}`;
	const current = await getPreviousSets();
	current[key] = sets;
	await setPreviousSets(current);
}

export async function getProfiles(): Promise<StoredProfile[]> {
	return (await get<StoredProfile[]>(STORAGE_KEYS.PROFILES)) ?? [];
}

export async function setProfiles(profiles: StoredProfile[]): Promise<void> {
	await set(STORAGE_KEYS.PROFILES, profiles);
}

export async function getLastSyncTime(): Promise<Date | null> {
	const timestamp = await get<string>(STORAGE_KEYS.LAST_SYNC);
	return timestamp ? new Date(timestamp) : null;
}

export async function setLastSyncTime(date: Date): Promise<void> {
	await set(STORAGE_KEYS.LAST_SYNC, date.toISOString());
}

export async function getPendingWorkout(): Promise<StoredWorkout | null> {
	return (await get<StoredWorkout>(STORAGE_KEYS.PENDING_WORKOUT)) ?? null;
}

export async function setPendingWorkout(
	workout: StoredWorkout | null,
): Promise<void> {
	if (workout === null) {
		await del(STORAGE_KEYS.PENDING_WORKOUT);
	} else {
		await set(STORAGE_KEYS.PENDING_WORKOUT, workout);
	}
}

export async function clearAllData(): Promise<void> {
	await clear();
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
