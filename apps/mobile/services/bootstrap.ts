import { api, unwrap } from "../lib/api";
import {
  type GymProfileMapping,
  type StoredGym,
  type StoredPreviousSets,
  type StoredProfile,
  type StoredSet,
  setGyms,
  setGymProfileMap,
  setPreviousSets,
  setProfiles,
} from "./storage";

export interface BootstrapData {
  gyms: StoredGym[];
  profiles: StoredProfile[];
  gymProfileMappings: GymProfileMapping;
  previousSets: StoredPreviousSets;
}

export async function fetchBootstrapData(): Promise<BootstrapData> {
  const data = unwrap(await api.api.v1.sync.bootstrap.get());

  // Transform server data to local storage format
  const gyms: StoredGym[] = data.gyms.map((gym) => ({
    id: gym.id,
    name: gym.name,
    latitude: gym.latitude ?? null,
    longitude: gym.longitude ?? null,
    createdAt: gym.created_at ?? gym.createdAt ?? new Date().toISOString(),
  }));

  const profiles: StoredProfile[] = data.profiles.map(
    (profile) => ({
      id: profile.id,
      exerciseId: profile.exercise_id ?? profile.exerciseId,
      name: profile.name,
    }),
  );

  // Transform gym profile mappings to local format
  const gymProfileMappings: GymProfileMapping = {};
  for (const mapping of data.gym_profile_mappings) {
    const key = `${mapping.exercise_id ?? mapping.exerciseId}_${mapping.gym_id ?? mapping.gymId}`;
    gymProfileMappings[key] = mapping.profile_id ?? mapping.profileId;
  }

  // Transform previous sets to local format
  const previousSets: StoredPreviousSets = {};
  for (const [key, sets] of Object.entries(
    data.previous_sets as Record<
      string,
      { reps: number; weight: string | number; weight_unit?: string; weightUnit?: string; side?: string }[]
    >,
  )) {
    previousSets[key] = sets.map(
      (set, index): StoredSet => ({
        id: `bootstrap_${key}_${index}`,
        reps: set.reps,
        weight: Number(set.weight),
        weightUnit: set.weight_unit ?? set.weightUnit ?? "kg",
        createdAt: new Date().toISOString(),
        side: (set.side as "L" | "R" | undefined) ?? undefined,
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

export function applyBootstrapData(data: BootstrapData): void {
  setGyms(data.gyms);
  setProfiles(data.profiles);
  setGymProfileMap(data.gymProfileMappings);
  setPreviousSets(data.previousSets);
}
