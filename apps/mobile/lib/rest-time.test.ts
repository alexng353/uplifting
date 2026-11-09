import { expect, test } from "bun:test";
import { formatRestTime, parseRestTime } from "./rest-time";

// Alex, Nov 9: "What happened to the rest timer being a number/time input".
test("plain seconds, m:ss and 2m / 1m30s / 45s all parse", () => {
  expect(parseRestTime("75")).toBe(75);
  expect(parseRestTime("1:30")).toBe(90);
  expect(parseRestTime(" 2:05 ")).toBe(125);
  expect(parseRestTime("2m")).toBe(120);
  expect(parseRestTime("1m30s")).toBe(90);
  expect(parseRestTime("1m 30")).toBe(90);
  expect(parseRestTime("45s")).toBe(45);
});

test("clamped to 10 s - 15 min", () => {
  expect(parseRestTime("3")).toBe(10);
  expect(parseRestTime("0:00")).toBe(10);
  expect(parseRestTime("20:00")).toBe(900);
  expect(parseRestTime("999")).toBe(900);
});

test("anything else is not a time", () => {
  for (const bad of ["", "abc", "1:75", "1:2:3", "-30", "1.5", "m", "s"]) {
    expect(parseRestTime(bad)).toBeNull();
  }
});

test("formats as m:ss and round-trips", () => {
  expect(formatRestTime(90)).toBe("1:30");
  expect(formatRestTime(45)).toBe("0:45");
  expect(formatRestTime(600)).toBe("10:00");
  for (const s of [10, 75, 135, 900]) expect(parseRestTime(formatRestTime(s))).toBe(s);
});
