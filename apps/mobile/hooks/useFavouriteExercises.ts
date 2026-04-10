import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

export function useFavouriteExercises() {
  return useQuery({
    queryKey: ["favouriteExercises"],
    queryFn: async () => {
      const data = unwrap(await api.api.v1.exercises.favourites.get());
      return new Set(data);
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
        const { error } = await api.api.v1.exercises({ exerciseId }).favourite.delete();
        if (error) throw new Error("Failed to remove favourite");
      } else {
        const { error } = await api.api.v1.exercises({ exerciseId }).favourite.post();
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
