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
