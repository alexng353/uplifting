import { describe, expect, test } from "bun:test";

import {
  distanceFor,
  formatDuration,
  formatTimedSet,
  liftLabel,
  parseDuration,
  speedUnitFor,
  timedUpdate,
} from "./timed";

describe("timed sets", () => {
  test("durations format and parse", () => {
    expect(formatDuration(600)).toBe("10:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(parseDuration("10")).toBe(600);
    expect(parseDuration("10:30")).toBe(630);
    expect(parseDuration("10.30")).toBe(630);
    expect(parseDuration("10:")).toBe(600);
    expect(parseDuration("")).toBeUndefined();
    expect(parseDuration("0")).toBeUndefined();
    expect(parseDuration("5:75")).toBeUndefined();
  });

  test("Alex's walk: 10 minutes at 3.5 mph and 3.5% incline", () => {
    const u = timedUpdate(600, 3.5, speedUnitFor("lbs"), 3.5);
    expect(u).toMatchObject({
      durationSeconds: 600,
      speed: 3.5,
      speedUnit: "mph",
      incline: 3.5,
      distance: 0.583,
      distanceUnit: "mi",
      reps: 1,
      weight: 0,
    });
    expect(formatTimedSet(u)).toBe("10:00 · 3.5 mph · 3.5%");
    expect(speedUnitFor("kg")).toBe("km/h");
    expect(distanceFor(6, 1800)).toBe(3);
  });

  test("clearing the duration un-logs the set", () => {
    expect(timedUpdate(undefined, 3.5, "mph", undefined)).toMatchObject({
      reps: undefined,
      weight: undefined,
      distance: undefined,
    });
  });

  test("bodyweight lifts read as reps", () => {
    expect(liftLabel(25, 0, "lbs")).toBe("25 reps");
    expect(liftLabel(6, 135, "lbs")).toBe("6×135 lbs");
  });
});
