import { expect, mock, test } from "bun:test";

mock.module("@react-native-async-storage/async-storage", () => ({
  default: { setItem: async () => {}, removeItem: async () => {}, getItem: async () => null },
}));
mock.module("expo-crypto", () => ({ randomUUID: () => crypto.randomUUID() }));
const { previousFor, warmupKinds } = await import("./warmup-apply");

const s = (id: string, reps: number, weight: number) => ({
  id,
  reps,
  weight,
  weightUnit: "lbs",
  createdAt: "2026-11-09T23:00:00Z",
});

// Alex, build 33: today on the default profile, history under another profile. The ghost
// suggested 200 from that history, but warmups only looked at this profile, found nothing,
// and 6x100 stayed a working set.
test("warmups use the same history the suggestions use", () => {
  const previous = { chest_brodway: [s("a", 6, 100), s("b", 8, 200), s("c", 6, 200)] };
  const history = previousFor(previous, "chest", undefined);
  const kinds = warmupKinds(
    {
      exerciseId: "chest",
      exerciseType: "machine",
      sets: [s("1", 6, 100), s("2", 8, 200), s("3", 6, 200)],
    },
    history,
  );
  expect(kinds).toEqual(["warmup", "working", "working"]);
});

// Alex, build 35 (17:07): shoulder press, two ghost working rows, then w1 10x20 logged in
// the third row. It showed under the ghosts, and ghost 1 offered last time's warmup (95)
// as a working set. Last session (unflagged): 6x95, 6x143, 6x143.
test("a warmup logged below ghost rows moves above them, and the ghosts suggest working sets", async () => {
  const { moveWarmupsFirstMutation } = await import("./workout-mutations");
  const { suggestionSlot, lastWarmupCount } = await import("./previous-sets");
  const ghost = (id: string): ReturnType<typeof s> & { reps?: number; weight?: number } =>
    ({
      id,
      weightUnit: "lbs",
      createdAt: "2026-11-09T23:00:00Z",
    }) as never;
  const history = [s("h1", 6, 95), s("h2", 6, 143), s("h3", 6, 143)];
  const exercise = {
    exerciseId: "press",
    exerciseType: "machine",
    sets: [ghost("g1"), ghost("g2"), s("w", 10, 20)],
  };
  const before = warmupKinds(exercise, history);
  expect(before).toEqual(["working", "working", "warmup"]);
  const lastWarmups = lastWarmupCount({ press_default: history }, "press", undefined);
  expect(lastWarmups).toBe(1);
  // The bug: ghost 1 thought no warmup was done yet and offered last time's 95.
  expect(suggestionSlot(before, [false, false, true], 0, lastWarmups)).toEqual({
    warmup: true,
    n: 1,
  });

  const workout = { id: "w", startTime: "", privacy: "private", exercises: [exercise] } as never;
  const moved = moveWarmupsFirstMutation(workout, "press", ["w"]) as {
    exercises: (typeof exercise)[];
  };
  const sets = moved.exercises[0].sets;
  expect(sets.map((x) => x.id)).toEqual(["w", "g1", "g2"]);
  const after = warmupKinds({ ...exercise, sets }, history);
  expect(after).toEqual(["warmup", "working", "working"]);
  const done = [true, false, false];
  expect(suggestionSlot(after, done, 1, lastWarmups)).toEqual({ warmup: false, n: 1 });
  expect(suggestionSlot(after, done, 2, lastWarmups)).toEqual({ warmup: false, n: 2 });
});

test("moving warmups first leaves logged working rows and other exercises alone", async () => {
  const { moveWarmupsFirstMutation } = await import("./workout-mutations");
  const exercise = {
    exerciseId: "press",
    exerciseType: "machine",
    sets: [s("w1", 6, 45), s("a", 6, 140), s("b", 6, 140)],
  };
  const other = { exerciseId: "row", exerciseType: "machine", sets: [s("r", 8, 100)] };
  const workout = { id: "w", startTime: "", privacy: "private", exercises: [exercise, other] };
  const same = moveWarmupsFirstMutation(workout as never, "press", ["w1"]) as typeof workout;
  expect(same.exercises[0]).toBe(exercise);
  expect(same.exercises[1]).toBe(other);
});
