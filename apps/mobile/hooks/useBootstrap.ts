import { useEffect, useState } from "react";
import { applyBootstrapData, fetchBootstrapData } from "../services/bootstrap";
import { detectAndSetNearbyGym } from "../services/geolocation";
import { useAuth } from "./useAuth";

interface BootstrapState {
  isBootstrapped: boolean;
  isLoading: boolean;
  error: Error | null;
}

/** The state plus which auth state it was computed for; null before the first run. */
type Tracked = BootstrapState & { forAuth: boolean | null };

/**
 * What callers see. A sign-in is loading from the very first render after
 * auth turns true: the effect that starts bootstrap runs only after that
 * render, and showing the app in between would mount every screen against
 * storage that isn't bootstrapped yet (or was just cleared by a sign-out).
 */
export function bootstrapView(isAuthenticated: boolean, state: Tracked): BootstrapState {
  if (isAuthenticated && state.forAuth !== true) {
    return { isBootstrapped: false, isLoading: true, error: null };
  }
  return { isBootstrapped: state.isBootstrapped, isLoading: state.isLoading, error: state.error };
}

export function useBootstrap() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<Tracked>({
    isBootstrapped: false,
    isLoading: true,
    error: null,
    forAuth: null,
  });

  useEffect(() => {
    // Each signed-in session bootstraps; signing out or in again re-runs it,
    // and a stale response from the previous session is ignored.
    if (!isAuthenticated) {
      setState({ isBootstrapped: false, isLoading: false, error: null, forAuth: false });
      return;
    }
    let cancelled = false;
    setState({ isBootstrapped: false, isLoading: true, error: null, forAuth: true });

    async function bootstrap() {
      try {
        const data = await fetchBootstrapData();
        if (cancelled) return;

        applyBootstrapData(data);
        if (cancelled) return;

        setState({
          isBootstrapped: true,
          isLoading: false,
          error: null,
          forAuth: true,
        });

        // Auto-detect nearby gym (fire-and-forget)
        detectAndSetNearbyGym().catch(() => {});
      } catch (err) {
        if (cancelled) return;

        setState({
          isBootstrapped: false,
          isLoading: false,
          error: err instanceof Error ? err : new Error("Bootstrap failed"),
          forAuth: true,
        });
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return bootstrapView(isAuthenticated, state);
}
