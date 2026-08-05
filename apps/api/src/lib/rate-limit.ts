/**
 * Minimal in-process fixed-window rate limiter.
 *
 * Good enough for the endpoints it guards (sign-in attempts and dynamic client
 * registration on a single-instance API). If this deployment ever runs more
 * than one instance, move the counters to Postgres or Redis — per-process
 * limits multiply by the instance count.
 */
interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
let lastSweep = 0;

export interface RateLimit {
  /** Requests permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets — suitable for a `Retry-After` header. */
  retryAfter: number;
}

export function checkRateLimit(key: string, { limit, windowMs }: RateLimit): RateLimitResult {
  const now = Date.now();

  // Sweep expired windows at most once a minute so the map can't grow without
  // bound on a long-running process.
  if (now - lastSweep > 60_000) {
    for (const [existing, window] of windows) {
      if (window.resetAt <= now) windows.delete(existing);
    }
    lastSweep = now;
  }

  const window = windows.get(key);
  if (!window || window.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  window.count += 1;
  if (window.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((window.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

/** Clears a key's window, e.g. after a successful sign-in. */
export function resetRateLimit(key: string): void {
  windows.delete(key);
}

/** Best-effort client IP, trusting the proxy headers this API runs behind. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
