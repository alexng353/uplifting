import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useAllExerciseProfiles() {
	return useQuery({
		queryKey: ["exerciseProfiles"],
		queryFn: async () => {
			const { data, error } = await api.getAllProfiles();
			if (error || !data) {
				throw new Error("Failed to fetch exercise profiles");
			}
			// Group by exercise_id for easier lookup
			const grouped = new Map<string, typeof data>();
			for (const profile of data) {
				const existing = grouped.get(profile.exercise_id) ?? [];
				existing.push(profile);
				grouped.set(profile.exercise_id, existing);
			}
			return grouped;
		},
	});
}

export function useExerciseProfiles(exerciseId: string) {
	return useQuery({
		queryKey: ["exerciseProfiles", exerciseId],
		queryFn: async () => {
			const { data, error } = await api.getProfiles({
				path: { exercise_id: exerciseId },
			});
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
			const { data, error } = await api.createProfile({
				path: { exercise_id: exerciseId },
				body: { name },
			});
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
