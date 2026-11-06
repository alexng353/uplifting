/**
 * The workout page on screen, shared with the Live Activity, which runs in the tab layout
 * so it also ends when the Workout screen never mounted (e.g. an auto-capped workout).
 */
let current = 0;
const listeners = new Set<(index: number) => void>();

export function getActiveSlide(): number {
  return current;
}

export function setActiveSlide(index: number): void {
  if (index === current) return;
  current = index;
  listeners.forEach((l) => l(index));
}

export function subscribeActiveSlide(listener: (index: number) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
