import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";

const EXERCISE_NOTES_KEY = ["exerciseNotes"] as const;

/**
 * All of the user's persistent exercise notes (cues), keyed by exerciseId.
 * A cue is a note that shows every time you do that exercise.
 */
export function useExerciseNotes() {
  return useQuery({
    queryKey: EXERCISE_NOTES_KEY,
    queryFn: async () => {
      const data = unwrap(await api.api.v1.exercises.notes.get());
      const map = new Map<string, string>();
      for (const n of data) map.set(n.exercise_id, n.note);
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetExerciseNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ exerciseId, note }: { exerciseId: string; note: string }) => {
      unwrap(await api.api.v1.exercises({ exerciseId }).note.put({ note }));
      return { exerciseId, note: note.trim() };
    },
    onSuccess: ({ exerciseId, note }) => {
      queryClient.setQueryData<Map<string, string>>(EXERCISE_NOTES_KEY, (old) => {
        const map = new Map(old);
        if (note) map.set(exerciseId, note);
        else map.delete(exerciseId);
        return map;
      });
    },
  });
}
