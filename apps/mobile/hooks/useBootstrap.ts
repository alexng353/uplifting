import { useEffect, useState } from "react";
import { applyBootstrapData, fetchBootstrapData } from "../services/bootstrap";
import { detectAndSetNearbyGym } from "../services/geolocation";
import { useAuth } from "./useAuth";

interface BootstrapState {
  isBootstrapped: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useBootstrap() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<BootstrapState>({
    isBootstrapped: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Each signed-in session bootstraps; signing out or in again re-runs it,
    // and a stale response from the previous session is ignored.
    if (!isAuthenticated) {
      setState({ isBootstrapped: false, isLoading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ isBootstrapped: false, isLoading: true, error: null });

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
        });

        // Auto-detect nearby gym (fire-and-forget)
        detectAndSetNearbyGym().catch(() => {});
      } catch (err) {
        if (cancelled) return;

        setState({
          isBootstrapped: false,
          isLoading: false,
          error: err instanceof Error ? err : new Error("Bootstrap failed"),
        });
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return state;
}
