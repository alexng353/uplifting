import { afterEach, expect, mock, test } from "bun:test";
import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { getPreviousSetSuggestion } from "../lib/previous-sets";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
mock.module("@react-native-async-storage/async-storage", () => ({
  default: {
    setItem: async () => {},
    removeItem: async () => {},
  },
}));
mock.module("expo-crypto", () => ({ randomUUID: () => crypto.randomUUID() }));
mock.module("../services/geolocation", () => ({ detectAndSetNearbyGym: async () => null }));

const { WorkoutProvider, useWorkout } = await import("./useWorkout");
const {
  getCurrentWorkout,
  setCurrentWorkout,
  getPreviousSets,
  setPreviousSets,
  updatePreviousSets,
} = await import("../services/storage");
let actions: ReturnType<typeof useWorkout>;
let renderer: ReactTestRenderer;

function Probe() {
  actions = useWorkout();
  return null;
}

afterEach(async () => {
  if (renderer) await act(() => renderer.unmount());
  setCurrentWorkout(null);
  setPreviousSets({});
});

test.each([false, true])(
  "auto-add keeps the first decimal edit (unilateral: %s)",
  async (unilateral) => {
    await act(() => {
      renderer = create(
        <WorkoutProvider>
          <Probe />
        </WorkoutProvider>,
      );
    });
    await act(() => actions.startWorkout());
    await act(() => actions.addExercise("squat", "Squat"));
    if (unilateral) await act(() => actions.toggleUnilateral("squat"));
    const firstSet = actions.workout!.exercises[0].sets[0];
    // ExerciseSlide updates the set and appends the next empty row in one event.
    await act(() => {
      actions.updateSet("squat", firstSet.id, { reps: 0.5, weight: 20.5 });
      if (unilateral) actions.addUnilateralPair("squat", "kg");
      else actions.addSet("squat", "kg");
    });
    expect(actions.workout!.exercises[0].sets[0]).toMatchObject({ reps: 0.5, weight: 20.5 });
    expect(getCurrentWorkout()!.exercises[0].sets[0]).toMatchObject({ reps: 0.5, weight: 20.5 });
    expect(actions.workout!.exercises[0].sets).toHaveLength(unilateral ? 4 : 2);
  },
);

test("finishing alternating workout modes preserves independent offline suggestions", async () => {
  await act(() => {
    renderer = create(
      <WorkoutProvider>
        <Probe />
      </WorkoutProvider>,
    );
  });
  for (const [unilateral, weight, expectedBilateral, expectedUnilateral] of [
    [false, 200, 200, 20],
    [true, 100, 200, 100],
    [false, 210, 210, 100],
    [true, 110, 210, 110],
  ] as const) {
    await act(() => actions.startWorkout());
    await act(() => actions.addExercise("press", "Press"));
    if (unilateral) await act(() => actions.toggleUnilateral("press"));
    for (const set of actions.workout!.exercises[0].sets) {
      await act(() => actions.updateSet("press", set.id, { reps: 10, weight }));
    }
    await act(() => {
      actions.finishWorkout();
    });
    const history = getPreviousSets();
    expect(getPreviousSetSuggestion(history, "press", undefined, 1).weight).toBe(expectedBilateral);
    for (const side of ["L", "R"] as const) {
      expect(getPreviousSetSuggestion(history, "press", undefined, 1, side).weight).toBe(
        expectedUnilateral,
      );
    }
  }
  expect(getPreviousSets().press_default).toHaveLength(3);

  // Sync can return both modes together; repeated responses must not duplicate them.
  const synced = getPreviousSets().press_default;
  updatePreviousSets("press", null, synced);
  updatePreviousSets("press", null, synced);
  expect(getPreviousSets().press_default).toEqual(synced);

  // An exercise without logged sets must not erase either mode's history.
  updatePreviousSets("press", null, []);
  expect(getPreviousSets().press_default).toEqual(synced);
});
