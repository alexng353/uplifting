import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function useServerGyms(enabled = true) {
  return useQuery({
    queryKey: ["gyms"],
    queryFn: async () => {
      return unwrap(await api.api.v1.gyms.get());
    },
    enabled,
  });
}

export function useCreateServerGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      name: string;
      latitude?: number;
      longitude?: number;
    }) => {
      return unwrap(await api.api.v1.gyms.post(body));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gyms"] });
    },
  });
}

export function useUpdateServerGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gymId, name }: { gymId: string; name: string }) => {
      return unwrap(await api.api.v1.gyms({ gymId }).put({ name }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gyms"] });
    },
  });
}

export function useDeleteServerGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gymId: string) => {
      const { error } = await api.api.v1.gyms({ gymId }).delete();
      if (error) {
        throw new Error("Failed to delete gym");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gyms"] });
    },
  });
}

export function useServerGymProfileMappings(
  gymId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["gymProfileMappings", gymId],
    queryFn: async () => {
      if (!gymId) return [];
      return unwrap(await api.api.v1.gyms({ gymId })["profile-mappings"].get());
    },
    enabled: enabled && !!gymId,
  });
}

export function useSetServerGymProfileMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gymId,
      exerciseId,
      profileId,
    }: {
      gymId: string;
      exerciseId: string;
      profileId: string;
    }) => {
      return unwrap(
        await api.api.v1.gyms({ gymId })["profile-mappings"].put({
          exercise_id: exerciseId,
          profile_id: profileId,
        }),
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["gymProfileMappings", variables.gymId],
      });
    },
  });
}
