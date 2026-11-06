import { describe, expect, test } from "bun:test";

import {
  availableModes,
  defaultMode,
  filterByMode,
  peakSeries,
  xTickLabel,
} from "./exercise-chart";

const bi = (w: number) => ({ reps: 6, weight: w });
const side = (w: number, s: "R" | "L") => ({ reps: 6, weight: w, side: s });

// Shaped like Alex's Machine Preacher Curl: bilateral peaks earlier, per-side 45s lately.
const history = [
  { workout_id: "a", date: "2026-05-01T18:00:00Z", sets: [bi(70), bi(80)] },
  { workout_id: "b", date: "2026-07-31T18:00:00Z", sets: [bi(90)] },
  { workout_id: "c", date: "2026-08-03T18:00:00Z", sets: [side(25, "R"), side(45, "L")] },
  { workout_id: "d", date: "2026-11-05T18:00:00Z", sets: [side(25, "R"), side(45, "R"), bi(60)] },
];

describe("exercise chart", () => {
  test("modes present, bilateral first", () => {
    expect(availableModes(history)).toEqual(["bi", "side"]);
    expect(availableModes([history[0]])).toEqual(["bi"]);
  });

  test("default is the majority mode of the newest session", () => {
    expect(defaultMode(history)).toBe("side");
    expect(defaultMode(history.slice(0, 2))).toBe("bi");
    expect(defaultMode([])).toBe("bi");
  });

  test("filtering keeps each mode on its own line", () => {
    const toW = (s: { weight: number | string }) => Number(s.weight);
    expect(peakSeries(filterByMode(history, "bi"), toW).map((p) => p.weight)).toEqual([80, 90, 60]);
    expect(peakSeries(filterByMode(history, "side"), toW).map((p) => p.weight)).toEqual([45, 45]);
  });

  test("series is ordered by date, not input order", () => {
    const s = peakSeries([...history].reverse(), (x) => Number(x.weight));
    expect(s.map((p) => p.dateMs)).toEqual(s.map((p) => p.dateMs).sort((a, b) => a - b));
  });

  test("x labels fit the range", () => {
    const DAY = 86_400_000;
    const t = new Date(2026, 7, 3, 12).getTime();
    expect(xTickLabel(t, 30 * DAY)).toBe("Aug 3");
    expect(xTickLabel(t, 365 * DAY)).toBe("Aug");
    expect(xTickLabel(t, 900 * DAY)).toBe("Aug ’26");
  });
});
