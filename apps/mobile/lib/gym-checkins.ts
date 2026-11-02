/**
 * Gym check-ins: where the phone was when a workout started or finished.
 * Alex's hygiene gate reads them to see that he started at the gym on time,
 * before the finished workout syncs. They queue on the phone and are retried
 * until the server takes them, so a gym with no signal only delays them.
 *
 * Pure: storage, location and the network are passed in, so it is testable
 * without React Native.
 */
export type GymCheckin = {
  client_workout_id: string;
  kind: "start" | "finish";
  at: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
};

export type Fix = { latitude: number; longitude: number; accuracy: number | null };

export type CheckinDeps = {
  load: () => GymCheckin[];
  save: (queue: GymCheckin[]) => void;
  locate: () => Promise<Fix | null>;
  /** Resolves when the server stored it; throws on network or server errors. */
  send: (checkin: GymCheckin) => Promise<"stored" | "rejected">;
};

/** Old check-ins are dropped rather than retried forever. */
const MAX_QUEUE = 50;

/** Records one check-in with the current location (null when there's no fix), then tries to send. */
export async function recordCheckin(
  deps: CheckinDeps,
  clientWorkoutId: string,
  kind: GymCheckin["kind"],
  at: string,
): Promise<void> {
  let fix: Fix | null = null;
  try {
    fix = await deps.locate();
  } catch {
    fix = null;
  }
  const queue = deps
    .load()
    .filter((c) => !(c.client_workout_id === clientWorkoutId && c.kind === kind));
  queue.push({
    client_workout_id: clientWorkoutId,
    kind,
    at,
    latitude: fix?.latitude ?? null,
    longitude: fix?.longitude ?? null,
    accuracy_m: fix?.accuracy ?? null,
  });
  deps.save(queue.slice(-MAX_QUEUE));
  await flushCheckins(deps);
}

let flushing: Promise<void> | null = null;

/** Sends queued check-ins oldest first; stops at the first network error and keeps the rest. */
export function flushCheckins(deps: CheckinDeps): Promise<void> {
  flushing ??= (async () => {
    try {
      for (;;) {
        const [next] = deps.load();
        if (!next) return;
        try {
          await deps.send(next);
        } catch {
          return;
        }
        // Stored, or refused as malformed (retrying can't fix that): drop it either way.
        deps.save(
          deps
            .load()
            .filter(
              (c) => !(c.client_workout_id === next.client_workout_id && c.kind === next.kind),
            ),
        );
      }
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}
