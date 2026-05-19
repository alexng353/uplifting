import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (body: { username: string; password: string }): Promise<TokenPair> => {
      const { data, error } = await api.api.v1.auth.login.post(body);
      if (error || !data) {
        throw new Error("Failed to login");
      }
      return data as TokenPair;
    },
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: async (body: {
      username: string;
      password: string;
      real_name: string;
      email: string;
    }): Promise<TokenPair> => {
      const { data, error } = await api.api.v1.auth.signup.post(body);
      if (error || !data) {
        throw new Error("Failed to register");
      }
      return data as TokenPair;
    },
  });
}
