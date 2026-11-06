/**
 * "Finish Workout" from Siri / Shortcuts / the Action button opens the Finish summary.
 * The workout screen may mount after the intent arrives, so the request waits here.
 */
let finishRequested = false;
const listeners = new Set<() => void>();

export function requestFinish(): void {
  finishRequested = true;
  listeners.forEach((l) => l());
}

/** True once per request. */
export function takeFinishRequest(): boolean {
  const was = finishRequested;
  finishRequested = false;
  return was;
}

export function onFinishRequest(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
