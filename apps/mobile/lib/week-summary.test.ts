import { expect, test } from "bun:test";
import { weekSummary } from "./week-summary";

const at = (day: number, h: number) => new Date(2026, 10, day, h).toISOString();

test("lays out the week with workouts, rest, gym days and minutes", () => {
  const now = new Date(2026, 10, 5, 21); // Thu Nov 5
  const s = weekSummary(
    [
      {
        id: "a",
        name: "Push",
        startTime: at(2, 9),
        endTime: at(2, 10),
        kind: "workout",
        gymLocation: "Gold's",
      },
      {
        id: "b",
        name: "Legs",
        startTime: at(3, 9),
        endTime: at(3, 11),
        kind: "workout",
        gymLocation: "Gold's",
      },
      { id: "c", startTime: at(4, 12), kind: "rest" },
      {
        id: "d",
        name: "Arms",
        startTime: at(5, 18),
        endTime: at(5, 18),
        kind: "workout",
        gymLocation: "Home",
      },
      { id: "old", startTime: at(0, 9), kind: "workout" }, // day 0 of Nov = Oct 31, last week
    ],
    now,
  );
  expect(s.days.map((d) => d.dayOfMonth)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(s.days.map((d) => d.workout?.name ?? (d.rest ? "rest" : null))).toEqual([
    null,
    "Push",
    "Legs",
    "rest",
    "Arms",
    null,
    null,
  ]);
  expect(s.days[4].isToday).toBe(true);
  expect(s.days[5].isFuture).toBe(true);
  expect(s.workouts.map((w) => w.id)).toEqual(["a", "b", "d"]);
  expect(s.totalMinutes).toBe(180);
  expect([s.gymDays, s.topGym]).toEqual([3, "Gold's"]);
  expect(s.range).toBe("Nov 1 – 7");
});

test("a week spanning two months names both", () => {
  expect(weekSummary([], new Date(2026, 10, 30, 12)).range).toBe("Nov 29 – Dec 5");
});
