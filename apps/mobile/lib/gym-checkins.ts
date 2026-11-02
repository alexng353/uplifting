/**
 * Gym check-ins: where the phone was when a workout started or finished, for
 * the one account the server enrolls (Alex's hygiene gate,
 * alexng353/claude-codex-proxy src/gym.ts). The gate needs a Start before the
 * finished workout syncs, so each check-in is queued the moment it is tapped,
 * located afterwards, and sent when the network allows.
 *
 * Storage, location and the network are injected so this runs under bun test
 * without React Native. One module-level flag stops flushes from overlapping.
 */

/** What the server takes (apps/api/src/routes/gate.ts). */
export type GymCheckin = {
  client_workout_id: string;
  kind: "start" | "finish";
  at: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
};

/** A queued check-in: the payload plus who recorded it and whether its fix is still coming. */
export type QueuedCheckin = GymCheckin & {
  /** The enrolled user it belongs to; it is never sent under another account. */
  user: string;
  /** Phone time it was queued. */
  queued_at: number;
  /** Which app launch queued it. A lookup left running by an earlier launch will never finish. */
  launch?: string;
  locating: boolean;
};

export type Fix = { latitude: number; longitude: number; accuracy: number | null };

/** How a send ended: `done` leaves the queue (stored, or malformed so a retry can't help); `retry` keeps it. */
export type SendOutcome = "done" | "retry";

export type CheckinDeps = {
  load: () => QueuedCheckin[];
  save: (queue: QueuedCheckin[]) => void;
  /** The account enrolled for check-ins on this phone, or null. */
  enrolledUser: () => string | null;
  locate: () => Promise<Fix | null>;
  send: (checkin: GymCheckin) => Promise<SendOutcome>;
  now: () => number;
  /** This app launch's id. */
  launch: string;
};

/** Keep the newest 50; past that the oldest are dropped unsent. */
const MAX_QUEUE = 50;

/** What a server answer means for the queue; null status is success. 400/422 are malformed: a retry can't fix them. */
export function outcomeForStatus(status: number | null): SendOutcome {
  if (status === null) return "done";
  return status === 400 || status === 422 ? "done" : "retry";
}

type Key = { client_workout_id: string; kind: string };
const same = (a: Key, b: Key) => a.client_workout_id === b.client_workout_id && a.kind === b.kind;

/**
 * Queues one check-in at once (the first report per workout and kind wins, as
 * on the server), then adds the location when it arrives and tries to send.
 * Does nothing unless this phone's account is enrolled.
 */
export async function recordCheckin(
  deps: CheckinDeps,
  clientWorkoutId: string,
  kind: GymCheckin["kind"],
  at: string,
): Promise<void> {
  const user = deps.enrolledUser();
  if (!user) return;
  const key = { client_workout_id: clientWorkoutId, kind };
  const queue = deps.load();
  if (queue.some((c) => same(c, key))) return;
  queue.push({
    ...key,
    at,
    latitude: null,
    longitude: null,
    accuracy_m: null,
    user,
    queued_at: deps.now(),
    launch: deps.launch,
    locating: true,
  });
  deps.save(queue.slice(-MAX_QUEUE));

  const fix = await deps.locate().catch(() => null);
  // Re-read: a logout meanwhile cleared the queue, and then this entry must not come back.
  const current = deps.load();
  const entry = current.find((c) => same(c, key) && c.user === user);
  if (!entry) return;
  entry.locating = false;
  if (fix)
    Object.assign(entry, {
      latitude: fix.latitude,
      longitude: fix.longitude,
      accuracy_m: fix.accuracy,
    });
  deps.save(current);
  await flushCheckins(deps);
}

let flushing = false;

/**
 * Sends queued check-ins oldest first. One whose lookup is still running in
 * this launch waits for it, however long iOS suspended the app; one left
 * locating by an earlier launch (the app was killed) goes without a fix.
 * Entries from a different enrolled account are dropped; with no enrollment
 * known right now nothing is sent and nothing is deleted. Stops at the first
 * send to retry and keeps it and the rest. A call during a running flush
 * returns at once; the running loop re-reads the queue each pass.
 */
export async function flushCheckins(deps: CheckinDeps): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const user = deps.enrolledUser();
    if (!user) return;
    const all = deps.load();
    const theirs = all.filter((c) => c.user === user);
    if (theirs.length !== all.length) deps.save(theirs);
    for (;;) {
      const next = deps
        .load()
        .find((c) => c.user === user && (!c.locating || c.launch !== deps.launch));
      if (!next) return;
      const {
        user: _user,
        queued_at: _queued,
        launch: _launch,
        locating: _locating,
        ...payload
      } = next;
      const outcome = await deps.send(payload).catch((): SendOutcome => "retry");
      if (outcome === "retry") return;
      deps.save(deps.load().filter((c) => !same(c, next)));
    }
  } finally {
    flushing = false;
  }
}
