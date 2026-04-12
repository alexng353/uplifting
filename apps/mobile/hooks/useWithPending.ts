import type { UseQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

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
  query: UseQueryResult<TRemote[], unknown>;
  /** Function to fetch pending items from local storage (synchronous MMKV) */
  getPending: () => TLocal | TLocal[] | null;
  transformLocal: (local: TLocal) => TUnified;
  transformRemote: (remote: TRemote) => TUnified;
  isDuplicate?: (pending: TUnified, remote: TUnified) => boolean;
}

interface UseWithPendingResult<TUnified> {
  items: MaybesPendingItem<TUnified>[];
  data: TUnified[];
  pendingItems: TUnified[];
  syncedItems: TUnified[];
  hasPending: boolean;
  pendingCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  refreshPending: () => void;
}

export function useWithPending<TRemote, TLocal, TUnified>(
  options: UseWithPendingOptions<TRemote, TLocal, TUnified>,
): UseWithPendingResult<TUnified> {
  const { query, getPending, transformLocal, transformRemote, isDuplicate } = options;

  const [pendingRaw, setPendingRaw] = useState<TLocal[]>(() => {
    const pending = getPending();
    if (pending === null) return [];
    if (Array.isArray(pending)) return pending;
    return [pending];
  });

  // Refresh pending data
  const refreshPending = useCallback(() => {
    const pending = getPending();
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
    await query.refetch();
    refreshPending();
  }, [query, refreshPending]);

  // Transform and combine data
  const pendingItems = useMemo(() => pendingRaw.map(transformLocal), [pendingRaw, transformLocal]);
  const remoteData = query.data ?? [];
  const syncedItems = useMemo(() => remoteData.map(transformRemote), [remoteData, transformRemote]);

  // Filter out duplicates if isDuplicate is provided
  const filteredPending = useMemo(
    () =>
      isDuplicate
        ? pendingItems.filter(
            (pending) => !syncedItems.some((synced) => isDuplicate(pending, synced)),
          )
        : pendingItems,
    [pendingItems, syncedItems, isDuplicate],
  );

  // Build combined items list with pending status
  const items: MaybesPendingItem<TUnified>[] = useMemo(
    () => [
      ...filteredPending.map((data): PendingItem<TUnified> => ({ data, isPending: true })),
      ...syncedItems.map((data): SyncedItem<TUnified> => ({ data, isPending: false })),
    ],
    [filteredPending, syncedItems],
  );

  const data = useMemo(() => items.map((item) => item.data), [items]);

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
