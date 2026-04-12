import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function useAllExerciseProfiles() {
  return useQuery({
    queryKey: ["exerciseProfiles"],
    queryFn: async () => {
      const profiles = unwrap(await api.api.v1.exercises.profiles.get());
      // Group by exerciseId for easier lookup
      const grouped = new Map<string, typeof profiles>();
      for (const profile of profiles) {
        const exerciseId = profile.exerciseId;
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
      return unwrap(await api.api.v1.exercises({ exerciseId }).profiles.get());
    },
    enabled: !!exerciseId,
  });
}

export function useCreateExerciseProfile(exerciseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      return unwrap(await api.api.v1.exercises({ exerciseId }).profiles.post({ name }));
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
      return unwrap(
        await api.api.v1.exercises({ exerciseId }).profiles({ profileId }).put({ name }),
      );
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
