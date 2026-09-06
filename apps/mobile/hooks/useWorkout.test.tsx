import { afterEach, expect, mock, test } from "bun:test";
import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";

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
const { getCurrentWorkout, setCurrentWorkout } = await import("../services/storage");
let actions: ReturnType<typeof useWorkout>;
let renderer: ReactTestRenderer;

function Probe() {
  actions = useWorkout();
  return null;
}

afterEach(async () => {
  if (renderer) await act(() => renderer.unmount());
  setCurrentWorkout(null);
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
