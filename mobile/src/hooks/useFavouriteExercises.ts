import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useFavouriteExercises() {
	return useQuery({
		queryKey: ["favouriteExercises"],
		queryFn: async () => {
			const { data, error } = await api.listFavourites();
			if (error || !data) {
				throw new Error("Failed to fetch favourite exercises");
			}
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
				const { error } = await api.removeFavourite({
					path: { exercise_id: exerciseId },
				});
				if (error) throw new Error("Failed to remove favourite");
			} else {
				const { error } = await api.addFavourite({
					path: { exercise_id: exerciseId },
				});
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
