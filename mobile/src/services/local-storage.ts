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
	GYMS: "gyms",
	CURRENT_GYM: "current_gym",
	GYM_PROFILE_MAP: "gym_profile_map",
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
	// Current gym
	currentGymId: string | null;
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

// Gym operations
export async function getGyms(): Promise<StoredGym[]> {
	return (await get<StoredGym[]>(STORAGE_KEYS.GYMS)) ?? [];
}

export async function setGyms(gyms: StoredGym[]): Promise<void> {
	await set(STORAGE_KEYS.GYMS, gyms);
}

export async function addGym(
	name: string,
	latitude?: number | null,
	longitude?: number | null,
): Promise<StoredGym> {
	const gyms = await getGyms();
	const newGym: StoredGym = {
		id: generateId(),
		name,
		latitude: latitude ?? null,
		longitude: longitude ?? null,
		createdAt: new Date().toISOString(),
	};
	gyms.push(newGym);
	await setGyms(gyms);
	return newGym;
}

export async function updateGym(id: string, name: string): Promise<void> {
	const gyms = await getGyms();
	const index = gyms.findIndex((g) => g.id === id);
	if (index !== -1) {
		gyms[index].name = name;
		await setGyms(gyms);
	}
}

export async function deleteGym(id: string): Promise<void> {
	const gyms = await getGyms();
	const filtered = gyms.filter((g) => g.id !== id);
	await setGyms(filtered);

	// Clear current gym if it was deleted
	const currentGymId = await getCurrentGymId();
	if (currentGymId === id) {
		await setCurrentGymId(null);
	}
}

// Current gym operations
export async function getCurrentGymId(): Promise<string | null> {
	return (await get<string>(STORAGE_KEYS.CURRENT_GYM)) ?? null;
}

export async function setCurrentGymId(gymId: string | null): Promise<void> {
	if (gymId === null) {
		await del(STORAGE_KEYS.CURRENT_GYM);
	} else {
		await set(STORAGE_KEYS.CURRENT_GYM, gymId);
	}
}

// Gym profile mapping operations
export async function getGymProfileMap(): Promise<GymProfileMapping> {
	return (await get<GymProfileMapping>(STORAGE_KEYS.GYM_PROFILE_MAP)) ?? {};
}

export async function setGymProfileForExercise(
	exerciseId: string,
	gymId: string,
	profileId: string,
): Promise<void> {
	const map = await getGymProfileMap();
	const key = `${exerciseId}_${gymId}`;
	map[key] = profileId;
	await set(STORAGE_KEYS.GYM_PROFILE_MAP, map);
}

export async function getLastProfileForExerciseAtGym(
	exerciseId: string,
	gymId: string,
): Promise<string | null> {
	const map = await getGymProfileMap();
	const key = `${exerciseId}_${gymId}`;
	return map[key] ?? null;
}
