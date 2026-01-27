import type { UseQueryResult } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

/**
 * Represents an item that may be pending sync
 */
export interface PendingItem<T> {
	data: T;
	isPending: true;
}

export interface SyncedItem<T> {
	data: T;
	isPending: false;
}

export type MaybesPendingItem<T> = PendingItem<T> | SyncedItem<T>;

interface UseWithPendingOptions<TRemote, TLocal, TUnified> {
	/**
	 * React Query result for remote data
	 */
	query: UseQueryResult<TRemote[], unknown>;

	/**
	 * Function to fetch pending items from local storage
	 * Can return a single item or array of items
	 */
	getPending: () => Promise<TLocal | TLocal[] | null>;

	/**
	 * Transform local storage item to the unified format
	 */
	transformLocal: (local: TLocal) => TUnified;

	/**
	 * Transform remote item to the unified format
	 */
	transformRemote: (remote: TRemote) => TUnified;

	/**
	 * Optional: Check if a pending item matches a remote item (to avoid duplicates)
	 * If provided, pending items that match remote items will be filtered out
	 */
	isDuplicate?: (pending: TUnified, remote: TUnified) => boolean;
}

interface UseWithPendingResult<TUnified> {
	/**
	 * All items with pending status indicated
	 */
	items: MaybesPendingItem<TUnified>[];

	/**
	 * Just the data, flattened (pending items first)
	 */
	data: TUnified[];

	/**
	 * Pending items only
	 */
	pendingItems: TUnified[];

	/**
	 * Synced/remote items only
	 */
	syncedItems: TUnified[];

	/**
	 * Whether there are any pending items
	 */
	hasPending: boolean;

	/**
	 * Number of pending items
	 */
	pendingCount: number;

	/**
	 * Loading state from the query
	 */
	isLoading: boolean;

	/**
	 * Refresh both remote and local data
	 */
	refresh: () => Promise<void>;

	/**
	 * Refresh only local/pending data
	 */
	refreshPending: () => Promise<void>;
}

/**
 * A generic hook that combines remote data from React Query with pending local data.
 *
 * Use this when you need to:
 * - Show unsynced/pending items alongside synced data
 * - Refresh both remote and local data together
 * - Track pending status for each item
 *
 * @example
 * ```tsx
 * const { items, isLoading, refresh, hasPending } = useWithPending({
 *   query: useWorkouts(1, 10),
 *   getPending: getPendingWorkout,
 *   transformLocal: (local) => ({
 *     id: local.id,
 *     name: local.name,
 *     startTime: local.startTime,
 *   }),
 *   transformRemote: (remote) => ({
 *     id: remote.id,
 *     name: remote.name,
 *     startTime: remote.start_time,
 *   }),
 * });
 * ```
 */
export function useWithPending<TRemote, TLocal, TUnified>(
	options: UseWithPendingOptions<TRemote, TLocal, TUnified>,
): UseWithPendingResult<TUnified> {
	const { query, getPending, transformLocal, transformRemote, isDuplicate } =
		options;

	const [pendingRaw, setPendingRaw] = useState<TLocal[]>([]);

	// Load pending data on mount
	useEffect(() => {
		const load = async () => {
			const pending = await getPending();
			if (pending === null) {
				setPendingRaw([]);
			} else if (Array.isArray(pending)) {
				setPendingRaw(pending);
			} else {
				setPendingRaw([pending]);
			}
		};
		load();
	}, [getPending]);

	// Refresh pending data
	const refreshPending = useCallback(async () => {
		const pending = await getPending();
		if (pending === null) {
			setPendingRaw([]);
		} else if (Array.isArray(pending)) {
			setPendingRaw(pending);
		} else {
			setPendingRaw([pending]);
		}
	}, [getPending]);

	// Refresh both remote and pending
	const refresh = useCallback(async () => {
		await Promise.all([query.refetch(), refreshPending()]);
	}, [query, refreshPending]);

	// Transform and combine data
	const pendingItems = pendingRaw.map(transformLocal);
	const remoteData = query.data ?? [];
	const syncedItems = remoteData.map(transformRemote);

	// Filter out duplicates if isDuplicate is provided
	const filteredPending = isDuplicate
		? pendingItems.filter(
				(pending) =>
					!syncedItems.some((synced) => isDuplicate(pending, synced)),
			)
		: pendingItems;

	// Build combined items list with pending status
	const items: MaybesPendingItem<TUnified>[] = [
		...filteredPending.map(
			(data): PendingItem<TUnified> => ({ data, isPending: true }),
		),
		...syncedItems.map(
			(data): SyncedItem<TUnified> => ({ data, isPending: false }),
		),
	];

	// Flattened data array (pending first)
	const data = items.map((item) => item.data);

	return {
		items,
		data,
		pendingItems: filteredPending,
		syncedItems,
		hasPending: filteredPending.length > 0,
		pendingCount: filteredPending.length,
		isLoading: query.isLoading,
		refresh,
		refreshPending,
	};
}
