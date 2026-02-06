import { set } from "idb-keyval";
import { api } from "../lib/api";
import {
	type GymProfileMapping,
	STORAGE_KEYS,
	type StoredGym,
	type StoredPreviousSets,
	type StoredProfile,
	type StoredSet,
	setGyms,
	setPreviousSets,
	setProfiles,
} from "./local-storage";

export interface BootstrapData {
	gyms: StoredGym[];
	profiles: StoredProfile[];
	gymProfileMappings: GymProfileMapping;
	previousSets: StoredPreviousSets;
}

export async function fetchBootstrapData(): Promise<BootstrapData> {
	const { data, error } = await api.getBootstrap();

	if (error || !data) {
		throw new Error("Failed to fetch bootstrap data");
	}

	// Transform server data to local storage format
	const gyms: StoredGym[] = data.gyms.map((gym) => ({
		id: gym.id,
		name: gym.name,
		latitude: gym.latitude ?? null,
		longitude: gym.longitude ?? null,
		createdAt: gym.created_at,
	}));

	const profiles: StoredProfile[] = data.profiles.map((profile) => ({
		id: profile.id,
		exerciseId: profile.exercise_id,
		name: profile.name,
	}));

	// Transform gym profile mappings to local format
	// Server returns array, we need map with key: `${exerciseId}_${gymId}` -> profileId
	const gymProfileMappings: GymProfileMapping = {};
	for (const mapping of data.gym_profile_mappings) {
		const key = `${mapping.exercise_id}_${mapping.gym_id}`;
		gymProfileMappings[key] = mapping.profile_id;
	}

	// Transform previous sets to local format
	// Server returns HashMap<String, Vec<BootstrapPreviousSet>>
	// Local needs StoredPreviousSets which is { [key: string]: StoredSet[] }
	const previousSets: StoredPreviousSets = {};
	for (const [key, sets] of Object.entries(data.previous_sets)) {
		previousSets[key] = sets.map(
			(set, index): StoredSet => ({
				id: `bootstrap_${key}_${index}`,
				reps: set.reps,
				weight: Number(set.weight),
				weightUnit: set.weight_unit,
				createdAt: new Date().toISOString(),
				side: set.side as "L" | "R" | undefined,
			}),
		);
	}

	return {
		gyms,
		profiles,
		gymProfileMappings,
		previousSets,
	};
}

export async function applyBootstrapData(data: BootstrapData): Promise<void> {
	await Promise.all([
		setGyms(data.gyms),
		setProfiles(data.profiles),
		set(STORAGE_KEYS.GYM_PROFILE_MAP, data.gymProfileMappings),
		setPreviousSets(data.previousSets),
	]);
}
