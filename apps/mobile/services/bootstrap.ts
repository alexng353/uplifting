import { api } from "../lib/api";
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
  const { data, error } = await api.api.v1.sync.bootstrap.get();

  if (error || !data) {
    throw new Error("Failed to fetch bootstrap data");
  }

  // Cast to any to work around Eden Treaty union type narrowing
  const d = data as any;

  // Transform server data to local storage format
  const gyms: StoredGym[] = (d.gyms as any[]).map((gym: any) => ({
    id: gym.id,
    name: gym.name,
    latitude: gym.latitude ?? null,
    longitude: gym.longitude ?? null,
    createdAt: gym.created_at ?? gym.createdAt ?? new Date().toISOString(),
  }));

  const profiles: StoredProfile[] = (d.profiles as any[]).map(
    (profile) => ({
      id: profile.id,
      exerciseId: profile.exercise_id ?? profile.exerciseId,
      name: profile.name,
    }),
  );

  // Transform gym profile mappings to local format
  const gymProfileMappings: GymProfileMapping = {};
  for (const mapping of d.gym_profile_mappings as any[]) {
    const key = `${mapping.exercise_id ?? mapping.exerciseId}_${mapping.gym_id ?? mapping.gymId}`;
    gymProfileMappings[key] = mapping.profile_id ?? mapping.profileId;
  }

  // Transform previous sets to local format
  const previousSets: StoredPreviousSets = {};
  for (const [key, sets] of Object.entries(
    d.previous_sets as Record<string, any[]>,
  )) {
    previousSets[key] = sets.map(
      (set, index): StoredSet => ({
        id: `bootstrap_${key}_${index}`,
        reps: set.reps,
        weight: Number(set.weight),
        weightUnit: set.weight_unit ?? set.weightUnit,
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
