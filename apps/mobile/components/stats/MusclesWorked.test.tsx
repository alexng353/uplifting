import { afterEach, expect, mock, test } from "bun:test";
import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
mock.module("react-native", () => ({ View: "View", Text: "Text" }));
mock.module("react-native-svg", () => ({ SvgXml: "SvgXml" }));
let exercises: unknown[] = [];
mock.module("../../hooks/useExercises", () => ({ useExercises: () => ({ data: exercises }) }));

const { default: MusclesWorked } = await import("./MusclesWorked");
let renderer: ReactTestRenderer;
afterEach(async () => {
  if (renderer) await act(() => renderer.unmount());
});

test("draws front and back maps heated by the top exercises' muscles", async () => {
  // Shapes as the API returns them (local QA API, Nov 5).
  exercises = [
    {
      id: "dl",
      name: "Deadlift",
      primary_muscles: ["gluteus maximus", "erector spinae"],
      secondary_muscles: ["trapezius, upper", "hamstrings, biceps femoris long head"],
    },
    {
      id: "curl",
      name: "Dumbbell Curl",
      primary_muscles: ["biceps brachii, long head"],
      secondary_muscles: [],
    },
  ];
  await act(() => {
    renderer = create(
      <MusclesWorked
        exercises={[
          { id: "curl", sets: 24 },
          { id: "dl", sets: 12 },
        ]}
      />,
    );
  });
  const maps = renderer.root.findAllByType("SvgXml" as never);
  expect(maps).toHaveLength(2);
  const front = maps[0].props.xml as string;
  const back = maps[1].props.xml as string;
  expect(front).toContain('id="leftBicep" fill="#F2894B"');
  expect(back).toContain('id="leftGlute"');
  expect(back).not.toContain('id="leftGlute" fill="#27272a"');
});

test("renders nothing without muscle data", async () => {
  exercises = [];
  await act(() => {
    renderer = create(<MusclesWorked exercises={[{ id: "x", sets: 3 }]} />);
  });
  expect(renderer.toJSON()).toBeNull();
});
