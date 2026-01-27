import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useLoginMutation() {
	return useMutation({
		mutationFn: async (body: { username: string; password: string }) => {
			const { data, error } = await api.login({ body });
			if (error || !data) {
				throw new Error("Failed to login");
			}
			return data;
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
		}) => {
			const { data, error } = await api.signup({ body });
			if (error || !data) {
				throw new Error("Failed to register");
			}
			return data;
		},
	});
}
