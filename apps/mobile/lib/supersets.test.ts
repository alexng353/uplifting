import { describe, expect, test } from "bun:test";

import type { StoredSet } from "../services/storage";
import { detectSupersets, nextInRound, pairKey, supersetProgress } from "./supersets";

let n = 0;
const at = (min: number) => new Date(Date.UTC(2026, 10, 6, 22, min)).toISOString();
const logged = (min: number): StoredSet => ({
  id: `s${n++}`,
  reps: 10,
  weight: 20,
  weightUnit: "lbs",
  createdAt: at(0),
  doneAt: at(min),
});
const empty = (): StoredSet => ({ id: `s${n++}`, weightUnit: "lbs", createdAt: at(0) });
const ex = (exerciseId: string, sets: StoredSet[]) => ({
  exerciseId,
  exerciseName: exerciseId,
  sets,
});

describe("superset detection", () => {
  test("interleaved logs on two half-done exercises make a group", () => {
    // Tibialis raise, reverse lunge, tibialis raise: Alex's warmup superset.
    const w = [
      ex("tib", [logged(1), logged(5), empty()]),
      ex("lunge", [logged(3), empty(), empty()]),
      ex("squat", [empty()]),
    ];
    expect(detectSupersets(w)).toEqual([["tib", "lunge"]]);
    expect(nextInRound(["tib", "lunge"], w, "tib")).toBe("lunge");
    expect(supersetProgress(["tib", "lunge"], w, () => 3)).toBe("tib 2/3 · lunge 1/3");
  });

  test("finishing one exercise ends the group", () => {
    const w = [
      ex("tib", [logged(1), logged(5), logged(9)]),
      ex("lunge", [logged(3), logged(7), empty()]),
    ];
    expect(detectSupersets(w)).toEqual([]);
    const w2 = [
      ex("tib", [logged(1), logged(5), logged(9), empty()]),
      ex("lunge", [logged(3), logged(7), empty()]),
    ];
    expect(detectSupersets(w2, { finished: (id, d) => id === "tib" && d >= 3 })).toEqual([]);
  });

  test("two half-done warmups that were not alternated don't count", () => {
    const w = [
      ex("tib", [logged(1), logged(2), empty()]),
      ex("lunge", [logged(5), logged(6), empty()]),
    ];
    expect(detectSupersets(w)).toEqual([]);
  });

  test("'not a superset' sticks", () => {
    const w = [ex("a", [logged(1), logged(5), empty()]), ex("b", [logged(3), empty()])];
    expect(detectSupersets(w, { dismissed: [pairKey("b", "a")] })).toEqual([]);
  });

  test("the round ends when everyone has caught up", () => {
    const w = [ex("a", [logged(1), logged(5), empty()]), ex("b", [logged(3), logged(7), empty()])];
    expect(nextInRound(["a", "b"], w, "b")).toBeNull();
  });
});
