import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useSendFriendRequest() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await api.api.v1.friends.post({
        friend_id: userId,
      });
      if (error) {
        throw new Error("Failed to send friend request");
      }
    },
  });
}
