const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

/** Device registration must never refresh credentials or outlive account teardown. */
export async function requestPushToken(
  input: {
    method: "PUT" | "DELETE";
    token: string;
    accessToken: string;
    signal?: AbortSignal;
    timeoutMs?: number;
  },
  fetcher: typeof fetch = fetch,
) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (input.signal?.aborted) abort();
  input.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, input.timeoutMs ?? 5000);
  try {
    const response = await fetcher(`${API_URL}/api/v1/exercise-agent/push-token`, {
      method: input.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({ token: input.token }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Could not update notification registration");
  } finally {
    clearTimeout(timeout);
    input.signal?.removeEventListener("abort", abort);
  }
}
