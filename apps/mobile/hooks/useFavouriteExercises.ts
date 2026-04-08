import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useFavouriteExercises() {
  return useQuery({
    queryKey: ["favouriteExercises"],
    queryFn: async () => {
      const { data, error } = await api.api.v1.exercises.favourites.get();
      if (error || !data) {
        throw new Error("Failed to fetch favourite exercises");
      }
      return new Set(data as string[]);
    },
  });
}

export function useToggleFavourite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
      isFavourite,
    }: {
      exerciseId: string;
      isFavourite: boolean;
    }) => {
      if (isFavourite) {
        const { error } = await (api.api.v1.exercises as any)[exerciseId]
          .favourite.delete();
        if (error) throw new Error("Failed to remove favourite");
      } else {
        const { error } = await (api.api.v1.exercises as any)[exerciseId]
          .favourite.post();
        if (error) throw new Error("Failed to add favourite");
      }
      return { exerciseId, newState: !isFavourite };
    },
    onSuccess: ({ exerciseId, newState }) => {
      queryClient.setQueryData<Set<string>>(["favouriteExercises"], (old) => {
        const newSet = new Set(old);
        if (newState) {
          newSet.add(exerciseId);
        } else {
          newSet.delete(exerciseId);
        }
        return newSet;
      });
    },
  });
}
