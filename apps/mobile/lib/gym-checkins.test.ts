import { beforeEach, expect, test } from "bun:test";
import {
  LOCATE_GRACE_MS,
  flushCheckins,
  outcomeForStatus,
  recordCheckin,
  type CheckinDeps,
  type Fix,
  type GymCheckin,
  type QueuedCheckin,
} from "./gym-checkins";

const GOLDS: Fix = { latitude: 49.26346, longitude: -123.12054, accuracy: 18 };
let queue: QueuedCheckin[] = [];
let sent: GymCheckin[] = [];
let online = true;
let user: string | null = "alex";
let clock = 1_000_000;
let locate: () => Promise<Fix | null> = async () => GOLDS;

const deps: CheckinDeps = {
  load: () => queue.map((c) => ({ ...c })),
  save: (next) => {
    queue = next.map((c) => ({ ...c }));
  },
  enrolledUser: () => user,
  locate: () => locate(),
  send: async (c) => {
    if (!online) throw new Error("offline");
    sent.push(c);
    return "done";
  },
  now: () => clock,
};

beforeEach(() => {
  queue = [];
  sent = [];
  online = true;
  user = "alex";
  clock = 1_000_000;
  locate = async () => GOLDS;
});

test("a check-in carries the location and is sent at once, without queue fields", async () => {
  await recordCheckin(deps, "w1", "start", "2026-11-05T02:00:00.000Z");
  expect(sent).toEqual([
    {
      client_workout_id: "w1",
      kind: "start",
      at: "2026-11-05T02:00:00.000Z",
      latitude: 49.26346,
      longitude: -123.12054,
      accuracy_m: 18,
    },
  ]);
  expect(queue).toEqual([]);
});

test("a flush of an empty queue does not block later sends", async () => {
  await flushCheckins(deps);
  await recordCheckin(deps, "w3", "start", "2026-11-05T04:00:00.000Z");
  expect(sent.map((c) => c.client_workout_id)).toEqual(["w3"]);
});

test("offline, check-ins wait in order and go out on the next flush", async () => {
  online = false;
  await recordCheckin(deps, "w1", "start", "2026-11-05T02:00:00.000Z");
  locate = async () => null;
  await recordCheckin(deps, "w1", "finish", "2026-11-05T03:00:00.000Z");
  expect(queue.map((c) => [c.kind, c.latitude])).toEqual([
    ["start", 49.26346],
    ["finish", null],
  ]);
  online = true;
  await flushCheckins(deps);
  expect(sent.map((c) => c.kind)).toEqual(["start", "finish"]);
  expect(queue).toEqual([]);
});

test("the check-in is queued before the fix arrives, and waits for it", async () => {
  let resolveFix!: (f: Fix | null) => void;
  locate = () => new Promise((r) => (resolveFix = r));
  const recording = recordCheckin(deps, "w1", "finish", "2026-11-05T03:00:00.000Z");
  expect(queue).toMatchObject([{ client_workout_id: "w1", kind: "finish", locating: true }]);
  // A heartbeat meanwhile must not send it without its location.
  await flushCheckins(deps);
  expect(sent).toEqual([]);
  resolveFix(GOLDS);
  await recording;
  expect(sent).toMatchObject([{ kind: "finish", latitude: 49.26346 }]);
});

test("a fix that never came (app killed) is sent without one after the grace", async () => {
  locate = () => new Promise(() => {});
  void recordCheckin(deps, "w1", "start", "2026-11-05T02:00:00.000Z");
  await flushCheckins(deps);
  expect(sent).toEqual([]);
  clock += LOCATE_GRACE_MS;
  await flushCheckins(deps);
  expect(sent).toMatchObject([{ kind: "start", latitude: null }]);
});

test("a logout during the lookup drops the check-in; another account never sends it", async () => {
  let resolveFix!: (f: Fix | null) => void;
  locate = () => new Promise((r) => (resolveFix = r));
  const recording = recordCheckin(deps, "w1", "start", "2026-11-05T02:00:00.000Z");
  // Logout clears storage; someone else signs in.
  queue = [];
  user = "other";
  resolveFix(GOLDS);
  await recording;
  expect(queue).toEqual([]);
  expect(sent).toEqual([]);

  // An entry left from another account is dropped, not sent.
  queue = [
    {
      client_workout_id: "w2",
      kind: "start",
      at: "x",
      latitude: 1,
      longitude: 1,
      accuracy_m: 1,
      user: "alex",
      queued_at: clock,
      locating: false,
    },
  ];
  await flushCheckins(deps);
  expect(sent).toEqual([]);
  expect(queue).toEqual([]);
});

test("an account the server didn't enroll records nothing and never locates", async () => {
  user = null;
  let located = false;
  locate = async () => {
    located = true;
    return GOLDS;
  };
  await recordCheckin(deps, "w1", "start", "2026-11-05T02:00:00.000Z");
  expect({ located, queue, sent }).toEqual({ located: false, queue: [], sent: [] });
});

test("the first report per workout and kind wins, as on the server", async () => {
  online = false;
  await recordCheckin(deps, "w1", "start", "2026-11-05T02:00:00.000Z");
  await recordCheckin(deps, "w1", "start", "2026-11-05T02:30:00.000Z");
  expect(queue.map((c) => c.at)).toEqual(["2026-11-05T02:00:00.000Z"]);
});

test("a retry answer keeps the check-in for later", async () => {
  const retrying: CheckinDeps = { ...deps, send: async () => "retry" };
  await recordCheckin(retrying, "w1", "start", "2026-11-05T02:00:00.000Z");
  expect(queue).toHaveLength(1);
});

test("malformed answers drop the check-in; auth, missing route, server and network errors keep it", () => {
  expect(outcomeForStatus(null)).toBe("done");
  expect(outcomeForStatus(400)).toBe("done");
  expect(outcomeForStatus(422)).toBe("done");
  // 404 included: a phone on the new build before the API ships keeps its check-ins.
  for (const status of [401, 403, 404, 500, 502, 503])
    expect(outcomeForStatus(status)).toBe("retry");
});
