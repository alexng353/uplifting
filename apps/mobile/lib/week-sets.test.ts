import { expect, test } from "bun:test";

import { weekExerciseSets } from "./week-sets";

test("counts real sets, a side pair once, across workouts", () => {
  const out = weekExerciseSets([
    {
      exercises: [
        {
          exercise_id: "curl",
          sets: [{ reps: 6 }, { reps: 6, side: "R" }, { reps: 6, side: "L" }],
        },
        { exercise_id: "squat", sets: [{ reps: 0 }, { reps: null }] },
      ],
    },
    { exercises: [{ exercise_id: "curl", sets: [{ reps: "8" }, { reps: 5, side: "L" }] }] },
    null,
  ]);
  // curl: bi 2, R 1, L 2 → 4. squat has no real sets and is dropped.
  expect(out).toEqual([{ id: "curl", sets: 4 }]);
});
