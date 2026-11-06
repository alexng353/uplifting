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

/**
 * The page to show after removing the exercise at `removed` while `active` was on screen,
 * with `newCount` exercises left: the same exercise if it survived, else the one that slid
 * into its place, else the one before it (Add Exercise when none are left).
 */
export function slideAfterRemoval(active: number, removed: number, newCount: number): number {
  if (removed < active) return active - 1;
  if (removed > active) return active;
  if (active < newCount) return active;
  return Math.max(0, newCount - 1);
}
