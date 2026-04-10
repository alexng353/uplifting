import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useAllExerciseProfiles() {
  return useQuery({
    queryKey: ["exerciseProfiles"],
    queryFn: async () => {
      const { data, error } = await api.api.v1.exercises.profiles.get();
      if (error || !data) {
        throw new Error("Failed to fetch exercise profiles");
      }
      const profiles = data;
      // Group by exerciseId for easier lookup
      const grouped = new Map<string, typeof profiles>();
      for (const profile of profiles) {
        const exerciseId = profile.exercise_id ?? profile.exerciseId;
        const existing = grouped.get(exerciseId) ?? [];
        existing.push(profile);
        grouped.set(exerciseId, existing);
      }
      return grouped;
    },
  });
}

export function useExerciseProfiles(exerciseId: string) {
  return useQuery({
    queryKey: ["exerciseProfiles", exerciseId],
    queryFn: async () => {
      const { data, error } = await api.api.v1.exercises({ exerciseId }).profiles.get();
      if (error || !data) {
        throw new Error("Failed to fetch exercise profiles");
      }
      return data;
    },
    enabled: !!exerciseId,
  });
}

export function useCreateExerciseProfile(exerciseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await api.api.v1.exercises({ exerciseId }).profiles.post({ name });
      if (error || !data) {
        throw new Error("Failed to create exercise profile");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exerciseProfiles", exerciseId],
      });
    },
  });
}

export function useRenameExerciseProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
      profileId,
      name,
    }: {
      exerciseId: string;
      profileId: string;
      name: string;
    }) => {
      const { data, error } = await api.api.v1.exercises({ exerciseId }).profiles({ profileId }).put({ name });
      if (error || !data) {
        throw new Error("Failed to rename exercise profile");
      }
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["exerciseProfiles", variables.exerciseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["exerciseProfiles"],
      });
    },
  });
}
