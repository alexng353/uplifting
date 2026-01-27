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
	/**
	 * Function to get pending data from local storage
	 * Returns null if nothing is pending
	 */
	getPending: () => Promise<TLocal | null>;

	/**
	 * Function to save data locally
	 */
	saveLocal: (data: TLocal) => Promise<void>;

	/**
	 * Function to clear pending data after successful sync
	 */
	clearPending: () => Promise<void>;

	/**
	 * Transform local data to remote format for syncing
	 */
	toRemote: (local: TLocal) => TRemote;

	/**
	 * Function to sync data to remote server
	 * Should throw on failure
	 */
	syncRemote: (data: TRemote) => Promise<TResponse>;

	/**
	 * Optional: Callback after successful sync
	 * Use for any post-sync cleanup or cache invalidation
	 */
	onSyncSuccess?: (response: TResponse, localData: TLocal) => Promise<void>;

	/**
	 * Optional: Function to get last sync time from storage
	 */
	getLastSyncTime?: () => Promise<Date | null>;

	/**
	 * Optional: Function to save last sync time to storage
	 */
	setLastSyncTime?: (date: Date) => Promise<void>;

	/**
	 * Optional: Maximum number of retry attempts (default: 5)
	 */
	maxRetries?: number;

	/**
	 * Optional: Base delay for exponential backoff in ms (default: 30000)
	 * Actual delay = 2^retryCount * baseRetryDelay
	 */
	baseRetryDelayMs?: number;
}

export interface UseSyncedSaveResult<TLocal> extends SyncState {
	/** Whether the device is online */
	isOnline: boolean;

	/**
	 * Save data locally and attempt to sync to remote
	 * Always saves locally first, then attempts remote sync
	 * Returns true if both local and remote succeeded
	 */
	save: (data: TLocal) => Promise<boolean>;

	/**
	 * Force a sync attempt (manual retry)
	 * Resets retry count on manual trigger
	 */
	forceSync: () => Promise<boolean>;

	/**
	 * Clear error state
	 */
	clearError: () => void;
}

/**
 * A generic hook for saving data with local-first sync pattern.
 *
 * This hook implements the pattern:
 * 1. Always save to local storage first (never fails)
 * 2. Attempt to sync to remote server
 * 3. On failure, retry with exponential backoff (2^n * 30 seconds)
 * 4. Auto-retry when coming back online
 * 5. Show sync status and errors in UI
 *
 * @example
 * ```tsx
 * const { save, isSyncing, error, hasPending } = useSyncedSave({
 *   getPending: getPendingWorkout,
 *   saveLocal: setPendingWorkout,
 *   clearPending: () => setPendingWorkout(null),
 *   toRemote: (local) => ({
 *     name: local.name,
 *     start_time: local.startTime,
 *     // ... transform to API format
 *   }),
 *   syncRemote: (data) => api.syncWorkout({ body: data }),
 *   onSyncSuccess: async (response) => {
 *     // Invalidate queries, update caches, etc.
 *   },
 * });
 *
 * // In your save handler:
 * const handleSave = async () => {
 *   const success = await save(workoutData);
 *   if (!success) {
 *     // Data saved locally, sync will retry automatically
 *   }
 * };
 * ```
 */
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

	const [state, setState] = useState<SyncState>({
		isSyncing: false,
		lastSyncTime: null,
		hasPending: false,
		error: null,
		retryCount: 0,
		nextRetryAt: null,
	});

	// Refs to prevent concurrent operations and track timers
	const isSyncingRef = useRef(false);
	const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Load initial state
	useEffect(() => {
		const load = async () => {
			const [pending, lastSync] = await Promise.all([
				getPending(),
				getLastSyncTime?.() ?? Promise.resolve(null),
			]);
			setState((prev) => ({
				...prev,
				hasPending: pending !== null,
				lastSyncTime: lastSync,
			}));
		};
		load();
	}, [getPending, getLastSyncTime]);

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

			// 2^n * base delay
			const delayMs = 2 ** retryCount * baseRetryDelayMs;
			const nextRetryAt = new Date(Date.now() + delayMs);

			setState((prev) => ({
				...prev,
				retryCount,
				nextRetryAt,
			}));

			retryTimerRef.current = setTimeout(() => {
				retryTimerRef.current = null;
				// Trigger re-evaluation of auto-sync effect
				setState((prev) => ({ ...prev, nextRetryAt: null }));
			}, delayMs);
		},
		[maxRetries, baseRetryDelayMs],
	);

	const attemptSync = useCallback(
		async (isManual = false): Promise<boolean> => {
			// Prevent concurrent sync attempts
			if (isSyncingRef.current) {
				return false;
			}

			// Clear any pending retry timer on manual sync
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

			const pending = await getPending();
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

				// Run success callback if provided
				if (onSyncSuccess) {
					await onSyncSuccess(response, pending);
				}

				// Clear pending data
				await clearPending();

				// Update last sync time
				const now = new Date();
				if (setLastSyncTime) {
					await setLastSyncTime(now);
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

				// Schedule retry with exponential backoff
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

	// Save function: always saves locally, then attempts remote sync
	const save = useCallback(
		async (data: TLocal): Promise<boolean> => {
			// Always save locally first
			await saveLocal(data);
			setState((prev) => ({ ...prev, hasPending: true }));

			// Attempt remote sync
			return attemptSync(true);
		},
		[saveLocal, attemptSync],
	);

	// Manual sync trigger
	const forceSync = useCallback(() => attemptSync(true), [attemptSync]);

	// Clear error
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
