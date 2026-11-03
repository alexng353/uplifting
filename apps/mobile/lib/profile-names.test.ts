import { expect, test } from "bun:test";
import { exerciseTitle, stripProfileSuffix, withoutPickerHint } from "./profile-names";

test("strips one balanced trailing group, including the leaked nested hint", () => {
  expect(
    stripProfileSuffix("Machine Shoulder Press (Black machine broadway (last used here))"),
  ).toBe("Machine Shoulder Press");
  expect(stripProfileSuffix("Machine Shoulder Press (Black machine broadway)")).toBe(
    "Machine Shoulder Press",
  );
  expect(stripProfileSuffix("Row (Neutral grip) (Cable 3)")).toBe("Row (Neutral grip)");
  expect(stripProfileSuffix("Bench Press")).toBe("Bench Press");
  expect(stripProfileSuffix("(Odd)")).toBe("(Odd)");
});

test("titles come from the base and the profile name", () => {
  expect(exerciseTitle("Press", "Black")).toBe("Press (Black)");
  expect(exerciseTitle("Press", undefined)).toBe("Press");
  expect(withoutPickerHint("Press (Black (last used here))")).toBe("Press (Black)");
});
