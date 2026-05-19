import { treaty } from "@elysiajs/eden";
import type { App } from "../../api/src/index";
import { AUTH_REQUIRED } from "../../api/src/lib/auth-errors";
import { getRefreshToken, getToken, setRefreshToken, setToken } from "../services/auth-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

async function applyAuthHeader(init: RequestInit): Promise<RequestInit> {
  const token = await getToken();
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("authorization", `Bearer ${token}`);
  return { ...init, headers };
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { access_token?: string; refresh_token?: string };
    if (!body.access_token || !body.refresh_token) return false;
    // Persist refresh token first — if the app dies between the two writes, the
    // next launch still has a valid refresh token to recover with. The reverse
    // order would leave a stale refresh token that trips reuse detection.
    await setRefreshToken(body.refresh_token);
    await setToken(body.access_token);
    return true;
  } catch {
    return false;
  }
}

async function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function authFetcher(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const withAuth = await applyAuthHeader(init ?? {});
  const res = await fetch(input, withAuth);
  if (res.status !== 401) return res;

  const body = await res
    .clone()
    .json()
    .catch(() => null);
  if (body?.code !== AUTH_REQUIRED) return res;

  const refreshed = await refreshOnce();
  if (!refreshed) {
    onUnauthorized?.();
    return res;
  }

  const retryInit = await applyAuthHeader(init ?? {});
  const retryRes = await fetch(input, retryInit);
  if (retryRes.status === 401) onUnauthorized?.();
  return retryRes;
}

export const api = treaty<App>(API_URL, {
  // Cast: eden types `fetcher` as the full `typeof fetch` (which includes
  // `preconnect`), but only invokes the call signature.
  fetcher: authFetcher as unknown as typeof fetch,
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
