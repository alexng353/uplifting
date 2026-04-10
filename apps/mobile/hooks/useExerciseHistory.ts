import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function useExerciseHistory(
  exerciseId: string,
  months: number | null,
  profileId?: string | null,
) {
  return useQuery({
    queryKey: ["exercise-history", exerciseId, months, profileId],
    queryFn: async () => {
      return unwrap(
        await api.api.v1.exercises({ exerciseId }).history.get({
          query: {
            months: months != null ? String(months) : undefined,
            profile_id: profileId ?? undefined,
          },
        }),
      );
    },
    enabled: !!exerciseId,
  });
}
