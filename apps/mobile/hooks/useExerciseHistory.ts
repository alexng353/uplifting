import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useExerciseHistory(
  exerciseId: string,
  months: number | null,
  profileId?: string | null,
) {
  return useQuery({
    queryKey: ["exercise-history", exerciseId, months, profileId],
    queryFn: async () => {
      const { data, error } = await (api.api.v1.exercises as any)[exerciseId]
        .history.get({
          query: {
            months: months != null ? String(months) : undefined,
            profile_id: profileId ?? undefined,
          },
        });
      if (error || !data) throw new Error("Failed to fetch exercise history");
      return data;
    },
    enabled: !!exerciseId,
  });
}
