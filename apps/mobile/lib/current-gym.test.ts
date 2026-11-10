import { expect, test } from "bun:test";
import {
  DETECTION_HOLD_MS,
  haversineDistance,
  nearestGym,
  nextCurrentGym,
  serverGymApplies,
} from "./current-gym";

// Gold's Gym West Broadway and SFU Rec, roughly; 15 km apart.
const golds = { id: "golds", latitude: 49.2636, longitude: -123.1386 };
const sfu = { id: "sfu", latitude: 49.2781, longitude: -122.9199 };
const near = (g: { latitude: number; longitude: number }, dLat = 0.0005) => ({
  latitude: g.latitude + dLat,
  longitude: g.longitude,
});

test("picks the saved gym the phone is at, not the last one used", () => {
  expect(nearestGym(near(golds), [sfu, golds])?.id).toBe("golds");
  expect(nearestGym(near(sfu), [sfu, golds])?.id).toBe("sfu");
});

test("nothing within the radius: no pick, so the caller keeps the last gym", () => {
  expect(nearestGym(near(golds, 0.01), [sfu, golds])).toBeNull();
});

test("the nearest of two gyms in range wins", () => {
  const across = { id: "across", latitude: golds.latitude + 0.002, longitude: golds.longitude };
  expect(nearestGym(near(golds, 0.0004), [across, golds])?.id).toBe("golds");
});

test("gyms saved without coordinates are skipped", () => {
  expect(nearestGym(near(golds), [{ id: "x", latitude: null, longitude: null }])).toBeNull();
});

test("haversine distance is about right", () => {
  const d = haversineDistance(golds, sfu);
  expect(d).toBeGreaterThan(15_000);
  expect(d).toBeLessThan(17_000);
});

// Alex, Nov 9: "Shouldn't current gym be location based why is it sticky".
test("a detected gym replaces the last one", () => {
  const base = { manualForWorkout: null, activeWorkoutId: "w1" };
  expect(nextCurrentGym({ ...base, detected: "golds", current: "sfu" })).toBe("golds");
  expect(nextCurrentGym({ ...base, detected: "golds", current: "golds" })).toBeNull();
});

test("location off or nothing near keeps the last gym", () => {
  expect(
    nextCurrentGym({
      detected: null,
      current: "sfu",
      manualForWorkout: null,
      activeWorkoutId: null,
    }),
  ).toBeNull();
});

test("a pick by hand holds for that workout, then location takes over again", () => {
  const pick = { detected: "golds", current: "sfu", manualForWorkout: "w1" };
  expect(nextCurrentGym({ ...pick, activeWorkoutId: "w1" })).toBeNull();
  expect(nextCurrentGym({ ...pick, activeWorkoutId: "w2" })).toBe("golds");
  expect(nextCurrentGym({ ...pick, activeWorkoutId: null })).toBe("golds");
});

test("a stale server gym doesn't undo a fresh detection, but later wins again", () => {
  const now = 1_000_000_000;
  const stale = { serverGymId: "sfu", localGymId: "golds", now };
  expect(serverGymApplies({ ...stale, detectedAt: now - 5_000 })).toBe(false);
  expect(serverGymApplies({ ...stale, detectedAt: now - DETECTION_HOLD_MS - 1 })).toBe(true);
  expect(serverGymApplies({ ...stale, detectedAt: null })).toBe(true);
  expect(
    serverGymApplies({ serverGymId: "golds", localGymId: "golds", detectedAt: now, now }),
  ).toBe(true);
});
