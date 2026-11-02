import { beforeEach, expect, test } from "bun:test";
import { flushCheckins, recordCheckin, type CheckinDeps, type GymCheckin } from "./gym-checkins";

let queue: GymCheckin[] = [];
let sent: GymCheckin[] = [];
let online = true;
let fix: { latitude: number; longitude: number; accuracy: number | null } | null = null;

const deps: CheckinDeps = {
  load: () => queue.map((c) => ({ ...c })),
  save: (next) => {
    queue = next.map((c) => ({ ...c }));
  },
  locate: async () => fix,
  send: async (c) => {
    if (!online) throw new Error("offline");
    sent.push(c);
    return "stored";
  },
};

beforeEach(() => {
  queue = [];
  sent = [];
  online = true;
  fix = { latitude: 49.26346, longitude: -123.12054, accuracy: 18 };
});

test("a check-in carries the location and is sent at once", async () => {
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

test("offline, check-ins wait in order and go out on the next flush", async () => {
  online = false;
  await recordCheckin(deps, "w1", "start", "2026-11-05T02:00:00.000Z");
  fix = null;
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

test("a failed location lookup still records the time", async () => {
  const failing: CheckinDeps = { ...deps, locate: async () => Promise.reject(new Error("denied")) };
  await recordCheckin(failing, "w2", "start", "2026-11-05T02:00:00.000Z");
  expect(sent[0]).toMatchObject({
    client_workout_id: "w2",
    latitude: null,
    longitude: null,
    accuracy_m: null,
  });
});
