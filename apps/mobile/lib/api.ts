import { treaty } from "@elysiajs/eden";
import type { App } from "../../api/src/index";
import { getToken } from "../services/auth-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

export const api = treaty<App>(API_URL, {
  headers: async () => {
    const token = await getToken();
    return token ? { authorization: `Bearer ${token}` } : {};
  },
});

/**
 * Unwrap an Eden Treaty response, narrowing the union type to exclude
 * `{ error: string }` and `undefined`. Throws on error responses.
 */
export function unwrap<T extends { data: unknown; error: unknown }>(
  response: T,
): NonNullable<Exclude<T["data"], { error: string }>> {
  if (response.error || !response.data) {
    const msg = response.error instanceof Error ? response.error.message : "API request failed";
    throw new Error(typeof msg === "string" ? msg : "API request failed");
  }
  return response.data as NonNullable<Exclude<T["data"], { error: string }>>;
}
