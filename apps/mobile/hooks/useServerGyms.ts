import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useServerGyms(enabled = true) {
  return useQuery({
    queryKey: ["gyms"],
    queryFn: async () => {
      const { data, error } = await api.api.v1.gyms.get();
      if (error || !data) {
        throw new Error("Failed to fetch gyms");
      }
      return data as any[];
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
      const { data, error } = await api.api.v1.gyms.post(body);
      if (error || !data) {
        throw new Error("Failed to create gym");
      }
      return data as any;
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
      const { data, error } = await (api.api.v1.gyms as any)[gymId].put({
        name,
      });
      if (error || !data) {
        throw new Error("Failed to update gym");
      }
      return data as any;
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
      const { error } = await (api.api.v1.gyms as any)[gymId].delete();
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
      const { data, error } = await (api.api.v1.gyms as any)[gymId][
        "profile-mappings"
      ].get();
      if (error || !data) {
        throw new Error("Failed to fetch gym profile mappings");
      }
      return data as any[];
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
      const { data, error } = await (api.api.v1.gyms as any)[gymId][
        "profile-mappings"
      ].put({
        exercise_id: exerciseId,
        profile_id: profileId,
      });
      if (error || !data) {
        throw new Error("Failed to set gym profile mapping");
      }
      return data as any;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["gymProfileMappings", variables.gymId],
      });
    },
  });
}
