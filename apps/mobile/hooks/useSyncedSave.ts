import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { useOnline } from "./useOnline";

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BASE_RETRY_DELAY_MS = 30 * 1000; // 30 seconds

export interface SyncState {
  /** Whether a sync operation is currently in progress */
  isSyncing: boolean;
  /** Last successful sync time */
  lastSyncTime: Date | null;
  /** Whether there's pending data waiting to be synced */
  hasPending: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Number of retry attempts made */
  retryCount: number;
  /** When the next automatic retry will occur */
  nextRetryAt: Date | null;
}

export interface UseSyncedSaveOptions<TLocal, TRemote, TResponse> {
  /** Function to get pending data from local storage */
  getPending: () => TLocal | null;
  /** Function to save data locally */
  saveLocal: (data: TLocal) => void;
  /** Function to clear pending data after successful sync */
  clearPending: () => void;
  /** Transform local data to remote format for syncing */
  toRemote: (local: TLocal) => TRemote;
  /** Function to sync data to remote server */
  syncRemote: (data: TRemote) => Promise<TResponse>;
  /** Optional: Callback after successful sync */
  onSyncSuccess?: (response: TResponse, localData: TLocal) => Promise<void>;
  /** Optional: Function to get last sync time from storage */
  getLastSyncTime?: () => Date | null;
  /** Optional: Function to save last sync time to storage */
  setLastSyncTime?: (date: Date) => void;
  /** Optional: Maximum number of retry attempts (default: 5) */
  maxRetries?: number;
  /** Optional: Base delay for exponential backoff in ms (default: 30000) */
  baseRetryDelayMs?: number;
}

export interface UseSyncedSaveResult<TLocal> extends SyncState {
  isOnline: boolean;
  save: (data: TLocal) => Promise<boolean>;
  forceSync: () => Promise<boolean>;
  clearError: () => void;
}

export function useSyncedSave<TLocal, TRemote, TResponse>(
  options: UseSyncedSaveOptions<TLocal, TRemote, TResponse>,
): UseSyncedSaveResult<TLocal> {
  const {
    getPending,
    saveLocal,
    clearPending,
    toRemote,
    syncRemote,
    onSyncSuccess,
    getLastSyncTime,
    setLastSyncTime,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseRetryDelayMs = DEFAULT_BASE_RETRY_DELAY_MS,
  } = options;

  const { isOnline } = useOnline();
  const { isAuthenticated } = useAuth();

  const [state, setState] = useState<SyncState>(() => {
    const pending = getPending();
    const lastSync = getLastSyncTime?.() ?? null;
    return {
      isSyncing: false,
      lastSyncTime: lastSync,
      hasPending: pending !== null,
      error: null,
      retryCount: 0,
      nextRetryAt: null,
    };
  });

  const isSyncingRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const scheduleRetry = useCallback(
    (retryCount: number) => {
      if (retryCount >= maxRetries) {
        setState((prev) => ({
          ...prev,
          error: `Sync failed after ${maxRetries} attempts. Tap to retry.`,
          nextRetryAt: null,
        }));
        return;
      }

      const delayMs = 2 ** retryCount * baseRetryDelayMs;
      const nextRetryAt = new Date(Date.now() + delayMs);

      setState((prev) => ({
        ...prev,
        retryCount,
        nextRetryAt,
      }));

      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        setState((prev) => ({ ...prev, nextRetryAt: null }));
      }, delayMs);
    },
    [maxRetries, baseRetryDelayMs],
  );

  const attemptSync = useCallback(
    async (isManual = false): Promise<boolean> => {
      if (isSyncingRef.current) return false;

      if (isManual && retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      if (!isOnline || !isAuthenticated) {
        setState((prev) => ({
          ...prev,
          error: isOnline ? "Not authenticated" : "No internet connection",
        }));
        return false;
      }

      const pending = getPending();
      if (!pending) {
        setState((prev) => ({
          ...prev,
          hasPending: false,
          retryCount: 0,
          nextRetryAt: null,
          error: null,
        }));
        return true;
      }

      isSyncingRef.current = true;
      setState((prev) => ({ ...prev, isSyncing: true, error: null }));

      try {
        const remoteData = toRemote(pending);
        const response = await syncRemote(remoteData);

        if (onSyncSuccess) {
          await onSyncSuccess(response, pending);
        }

        clearPending();

        const now = new Date();
        if (setLastSyncTime) {
          setLastSyncTime(now);
        }

        setState((prev) => ({
          ...prev,
          isSyncing: false,
          hasPending: false,
          lastSyncTime: now,
          retryCount: 0,
          nextRetryAt: null,
          error: null,
        }));

        return true;
      } catch (err) {
        const currentRetryCount = isManual ? 0 : state.retryCount;
        const nextRetryCount = currentRetryCount + 1;

        setState((prev) => ({
          ...prev,
          isSyncing: false,
          error: err instanceof Error ? err.message : "Sync failed",
          retryCount: nextRetryCount,
        }));

        scheduleRetry(nextRetryCount);
        return false;
      } finally {
        isSyncingRef.current = false;
      }
    },
    [
      isOnline,
      isAuthenticated,
      getPending,
      toRemote,
      syncRemote,
      onSyncSuccess,
      clearPending,
      setLastSyncTime,
      state.retryCount,
      scheduleRetry,
    ],
  );

  // Auto-sync when coming online or when retry timer fires
  useEffect(() => {
    if (
      isOnline &&
      isAuthenticated &&
      state.hasPending &&
      !state.isSyncing &&
      !state.nextRetryAt &&
      !isSyncingRef.current
    ) {
      attemptSync();
    }
  }, [
    isOnline,
    isAuthenticated,
    state.hasPending,
    state.isSyncing,
    state.nextRetryAt,
    attemptSync,
  ]);

  const save = useCallback(
    async (data: TLocal): Promise<boolean> => {
      saveLocal(data);
      setState((prev) => ({ ...prev, hasPending: true }));
      return attemptSync(true);
    },
    [saveLocal, attemptSync],
  );

  const forceSync = useCallback(() => attemptSync(true), [attemptSync]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    isOnline,
    save,
    forceSync,
    clearError,
  };
}
