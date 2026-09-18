import { expect, test } from "bun:test";
import { requestPushToken } from "./push-token-request";

function abortableFetch(onSignal: (signal: AbortSignal) => void): typeof fetch {
  return ((_url: unknown, init: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init.signal!;
      onSignal(signal);
      const abort = () => reject(new DOMException("Aborted", "AbortError"));
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    })) as unknown as typeof fetch;
}

test("timeout aborts the actual push registration request", async () => {
  let requestSignal: AbortSignal | undefined;
  await expect(
    requestPushToken(
      {
        method: "PUT",
        token: "device",
        accessToken: "captured-account",
        timeoutMs: 5,
      },
      abortableFetch((signal) => {
        requestSignal = signal;
      }),
    ),
  ).rejects.toThrow("Aborted");
  expect(requestSignal?.aborted).toBe(true);
});

test("account teardown aborts an in-flight registration", async () => {
  const account = new AbortController();
  let requestSignal: AbortSignal | undefined;
  const request = requestPushToken(
    {
      method: "PUT",
      token: "device",
      accessToken: "old-account",
      signal: account.signal,
    },
    abortableFetch((signal) => {
      requestSignal = signal;
    }),
  );
  account.abort();
  await expect(request).rejects.toThrow("Aborted");
  expect(requestSignal?.aborted).toBe(true);
});

test("uses captured credentials once and never refreshes or retries unauthorized cleanup", async () => {
  const calls: RequestInit[] = [];
  const fetcher = (async (_url: unknown, init: RequestInit) => {
    calls.push(init);
    return new Response(null, { status: 401 });
  }) as unknown as typeof fetch;
  await expect(
    requestPushToken({ method: "DELETE", token: "device", accessToken: "old-account" }, fetcher),
  ).rejects.toThrow("Could not update notification registration");
  expect(calls).toHaveLength(1);
  expect(calls[0]?.headers).toEqual({
    "Content-Type": "application/json",
    Authorization: "Bearer old-account",
  });
  expect(calls[0]?.body).toBe(JSON.stringify({ token: "device" }));
});
