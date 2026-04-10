# Rest Day Management

Resolves GitHub issue #1: "Duplicate rest days should not be allowed"

## Requirements

1. A day is either a rest day or not — mutual exclusion between rest days and workouts
2. Multiple workouts per day are allowed (existing behavior, unchanged)
3. Logging a rest day immediately changes the workout tab to a "Rest Day" view with a cancel button
4. No duplicate rest days per day

## Approach: Hybrid (Local-first + Server Reconciliation)

Local storage provides immediate UI response. Server data reconciles on mount/refresh. A timestamp (`startTime` on the `StoredWorkout`) deduplicates across devices. If timestamps match exactly, the client treats them as the same entry. If they differ, the server's version wins.

## Data Model

Rest days remain `StoredWorkout` objects with `kind: "rest"`. No new types.

### New storage key: `TODAY_REST_DAY`

A lightweight pointer that survives after `PENDING_WORKOUT` is cleared by sync:

```typescript
interface TodayRestDay {
  workoutId: string          // StoredWorkout.id (local)
  date: string               // YYYY-MM-DD for staleness check
  syncedWorkoutId?: string   // server-side workout ID after sync
}
```

The actual workout data flows through the existing path: `StoredWorkout` -> `PENDING_WORKOUT` -> sync -> server.

## Workout Tab — Three States

Currently two render branches (idle / active workout). Add a third:

1. **Idle**: No workout, no rest day today. Shows "Start Workout" + "Log Rest Day" buttons. If today already has completed workouts (from server data), "Log Rest Day" is hidden.
2. **Active Workout**: Exercise pager, timer, finish/cancel. Unchanged.
3. **Rest Day**: Bed icon, "Rest Day" heading, "Cancel Rest Day" button. No "Start Workout" button visible.

## Flows

### Log Rest Day

1. Check `todayRestDay` state -> block if already set
2. Check server workout data for today's workouts -> block if any exist
3. Create `StoredWorkout` with `kind: "rest"`, `startTime` = now
4. Save pointer to `TODAY_REST_DAY` storage
5. Set context state -> tab immediately flips to rest day view
6. Queue as `PENDING_WORKOUT` for sync
7. On sync success -> store `syncedWorkoutId` in `TODAY_REST_DAY`

### Cancel Rest Day

1. Clear `TODAY_REST_DAY` storage + context state -> tab flips back to idle
2. If `syncedWorkoutId` exists -> `DELETE /workouts/:syncedWorkoutId`
3. If still pending (not yet synced) -> clear `PENDING_WORKOUT` from storage
4. Invalidate `["workouts"]`, `["streak"]`, `["all-time-stats"]` queries

### Mount/Refresh Reconciliation

1. Load `TODAY_REST_DAY` from storage. If `date` is not today -> clear (stale).
2. Fetch today's workouts from server (via existing `useWorkouts` query).
3. Reconcile:
   - Server has rest day, local doesn't -> adopt server state (logged on another device). Populate `TODAY_REST_DAY` with server data.
   - Local has rest day, server doesn't -> still pending sync, keep local state.
   - Both have rest day, same `startTime` -> same entry, no conflict.
   - Both have rest day, different `startTime` -> server wins, update local to match (debounce).

## Server-side Dedup

In `POST /sync/workout`, when `kind = "rest"`:

1. Check if a rest day already exists for this user on the same date (comparing `start_time::date`)
2. If yes -> return the existing workout ID (idempotent, no duplicate created)
3. If no -> create normally

This is the safety net. Even if two devices race, the server only creates one rest day per user per day.

## Files to Change

| File | Change |
|------|--------|
| `apps/mobile/services/storage.ts` | Add `TODAY_REST_DAY` key, `TodayRestDay` type, getter/setter/clear functions |
| `apps/mobile/hooks/useWorkout.tsx` | Add `todayRestDay` state, `cancelRestDay` function, mount reconciliation, expose `todayHasWorkouts`. Update `logRestDay` to save `TODAY_REST_DAY` pointer and check for duplicates. |
| `apps/mobile/app/(tabs)/workout.tsx` | Add rest day render branch (third state). Hide "Log Rest Day" when today has workouts. |
| `apps/mobile/hooks/useSync.tsx` | After sync success for rest days, update `syncedWorkoutId` in `TODAY_REST_DAY` storage. |
| `apps/api/src/routes/sync.ts` | Add dedup check: if `kind = "rest"`, query for existing rest day on same user+date before inserting. |
