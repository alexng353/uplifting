import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../lib/api";
import { isGenerating } from "../lib/exercise-agent";
import { useCurrentUser } from "./useCurrentUser";
import { useAuth } from "./useAuth";

const endpoint = api.api.v1["exercise-agent"];

export function useExerciseAgent(id?: string) {
  const { isAuthenticated } = useAuth();
  const { data: user } = useCurrentUser();
  const client = useQueryClient();
  const enabled = isAuthenticated && !!user?.is_admin;
  const key = ["exercise-agent", user?.id];
  const sessions = useQuery({
    queryKey: [...key, "list"],
    queryFn: async () => unwrap(await endpoint.get()),
    enabled: enabled && !id,
    refetchInterval: 5000,
  });
  const session = useQuery({
    queryKey: [...key, id],
    queryFn: async () => unwrap(await endpoint({ id: id! }).get()),
    enabled: enabled && !!id,
    refetchInterval: (query) =>
      query.state.data && isGenerating(query.state.data.status) ? 2000 : false,
  });
  const action = useMutation({
    mutationFn: async (input: {
      type: "start" | "follow-up" | "approve" | "cancel";
      message?: string;
      revision?: number;
    }) => {
      if (!enabled) throw new Error("Administrator access required");
      if (input.type === "start") return unwrap(await endpoint.post({ message: input.message! }));
      if (!id) throw new Error("Select a session first");
      const resource = endpoint({ id });
      if (input.type === "follow-up")
        return unwrap(
          await resource["follow-up"].post({
            message: input.message!,
            revision: input.revision!,
          }),
        );
      if (input.type === "approve")
        return unwrap(await resource.approve.post({ revision: input.revision! }));
      return unwrap(await resource.cancel.post({}));
    },
    onSuccess: (data) => {
      client.setQueryData([...key, data.id], data);
      client.invalidateQueries({ queryKey: key });
      if (data.status === "approved") client.invalidateQueries({ queryKey: ["exercises"] });
    },
    // A conflict means another client changed this revision. Always reload it.
    onError: () => {
      client.invalidateQueries({ queryKey: key });
    },
  });
  return { enabled, sessions, session, action };
}
