import { afterEach, describe, expect, mock, test } from "bun:test";
import { act, useState, type ReactNode } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import type { StoredSet, StoredWorkoutExercise } from "../../services/storage";
import type { SetSuggestion } from "../../lib/previous-sets";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

mock.module("react-native", () => ({
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  Switch: "Switch",
  Modal: ({ visible, children }: { visible: boolean; children: ReactNode }) =>
    visible ? children : null,
  FlatList: "FlatList",
  KeyboardAvoidingView: "KeyboardAvoidingView",
  Platform: { OS: "ios" },
  Alert: { alert: () => {} },
}));
mock.module("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
mock.module("../../hooks/useThemeColors", () => ({ useThemeColors: () => ({}) }));
let settings: Record<string, unknown> = {};
let mode = "editing";
const HISTORY: SetSuggestion = { reps: 6, weight: 220, weightUnit: "kg" };
const LEFT_HISTORY: SetSuggestion = { reps: 5, weight: 100, weightUnit: "kg" };
let suggestionFor = (_setNumber: number, side?: "L" | "R"): SetSuggestion =>
  side === "L" ? LEFT_HISTORY : HISTORY;
mock.module("../../hooks/useSettings", () => ({
  useSettings: () => ({ settings, getDisplayUnit: () => "kg" }),
}));
mock.module("../../hooks/usePreviousSets", () => ({
  usePreviousSets: () => ({
    getSuggestion: (_exerciseId: string, _profileId: string, setNumber: number, side?: "L" | "R") =>
      suggestionFor(setNumber, side),
  }),
}));
mock.module("../../hooks/useExerciseProfiles", () => ({
  useExerciseProfiles: () => ({ data: [] }),
  useCreateExerciseProfile: () => ({}),
}));
mock.module("../../hooks/useExerciseNotes", () => ({
  useExerciseNotes: () => ({}),
  useSetExerciseNote: () => ({}),
}));
mock.module("../../hooks/useGymProfileSuggestion", () => ({
  useGymProfileSuggestion: () => ({ getSuggestedProfile: () => undefined }),
}));
mock.module("./RestTimer", () => ({ default: () => null }));

let exercise: StoredWorkoutExercise;
let setExerciseState: (exercise: StoredWorkoutExercise) => void;
// Like the real store's synchronous cache: auto-add runs before React rerenders.
function updateExercise(next: StoredWorkoutExercise) {
  exercise = next;
  setExerciseState(next);
}
const trimTrailingEmptySets = mock(() => {});

mock.module("../../hooks/useWorkoutActions", () => ({
  useWorkoutActions: () => ({
    mode,
    updateSet: (_exerciseId: string, setId: string, updates: Partial<StoredSet>) =>
      updateExercise({
        ...exercise,
        sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...updates } : set)),
      }),
    addSet: (_exerciseId: string, weightUnit: string, reps?: number, weight?: number) =>
      updateExercise({
        ...exercise,
        sets: [
          ...exercise.sets,
          makeSet(String(exercise.sets.length + 1), { weightUnit, reps, weight }),
        ],
      }),
    addUnilateralPair: (_exerciseId: string, weightUnit: string) =>
      updateExercise({
        ...exercise,
        sets: [
          ...exercise.sets,
          makeSet(`R${exercise.sets.length}`, { weightUnit, side: "R" }),
          makeSet(`L${exercise.sets.length}`, { weightUnit, side: "L" }),
        ],
      }),
    trimTrailingEmptySets,
  }),
}));

const { default: ExerciseSlide } = await import("./ExerciseSlide");
const { TextInput } = await import("react-native");

function makeSet(id: string, values: Partial<StoredSet> = {}): StoredSet {
  return { id, weightUnit: "kg", createdAt: "2026-09-06T12:00:00Z", ...values };
}

let renderer: ReactTestRenderer;

async function renderSets(sets: StoredSet[], isUnilateral = false, exerciseType?: string) {
  function Harness() {
    const [state, setState] = useState<StoredWorkoutExercise>({
      exerciseId: "exercise",
      exerciseName: "Squat",
      sets,
      isUnilateral,
      exerciseType,
    });
    exercise = state;
    setExerciseState = setState;
    return <ExerciseSlide exercise={state} />;
  }
  await act(() => {
    renderer = create(<Harness />);
  });
}

function input(row: number, field: "reps" | "weight") {
  return renderer.root.findAllByType(TextInput)[row * 2 + (field === "weight" ? 1 : 0)];
}

async function enter(row: number, field: "reps" | "weight", text: string) {
  await act(() => input(row, field).props.onChangeText(text));
}

afterEach(async () => {
  if (renderer) await act(() => renderer.unmount());
  trimTrailingEmptySets.mockClear();
  settings = {};
  mode = "editing";
  suggestionFor = (_setNumber, side) => (side === "L" ? LEFT_HISTORY : HISTORY);
});

function acceptButton(row: number) {
  return renderer.root.findAll(
    (node) => node.props.testID === "accept-suggestion" && typeof node.type === "string",
  )[row];
}

describe("accept suggestion", () => {
  test("fills the suggested reps and weight into an empty set", async () => {
    await renderSets([makeSet("1")]);
    await act(() => acceptButton(0).props.onPress());
    expect(exercise.sets[0]).toMatchObject({ reps: 6, weight: 220 });
    expect(input(0, "reps").props.value).toBe("6");
    expect(input(0, "weight").props.value).toBe("220");
    expect(acceptButton(0).props.disabled).toBe(true);
  });

  test("keeps typed reps and fills only the empty weight", async () => {
    await renderSets([makeSet("1", { reps: 8 })]);
    await act(() => acceptButton(0).props.onPress());
    expect(exercise.sets[0]).toMatchObject({ reps: 8, weight: 220 });
  });

  test("keeps a typed weight and fills only the empty reps", async () => {
    await renderSets([makeSet("1", { weight: 180 })]);
    await act(() => acceptButton(0).props.onPress());
    expect(exercise.sets[0]).toMatchObject({ reps: 6, weight: 180 });
  });

  test("accepts each unilateral side with its own history", async () => {
    await renderSets([makeSet("R", { side: "R" }), makeSet("L", { side: "L" })], true);
    await act(() => acceptButton(1).props.onPress());
    expect(exercise.sets[0].reps).toBeUndefined();
    expect(exercise.sets[1]).toMatchObject({ reps: 5, weight: 100 });
    await act(() => acceptButton(0).props.onPress());
    expect(exercise.sets[0]).toMatchObject({ reps: 6, weight: 220 });
  });

  test("converts history logged in another unit into the set's unit", async () => {
    suggestionFor = () => ({ reps: 5, weight: 220, weightUnit: "lbs" });
    await renderSets([makeSet("1")]);
    expect(input(0, "weight").props.placeholder).toBe("99.8");
    await act(() => acceptButton(0).props.onPress());
    expect(exercise.sets[0]).toMatchObject({ reps: 5, weight: 99.8, weightUnit: "kg" });
  });

  test("accepts reps-only bodyweight history as no added weight", async () => {
    suggestionFor = () => ({ reps: 12, weight: null, weightUnit: "kg" });
    await renderSets([makeSet("1")], false, "Bodyweight");
    await act(() => acceptButton(0).props.onPress());
    expect(exercise.sets[0]).toMatchObject({ reps: 12, weight: 0 });
  });

  test("cannot accept made-up defaults when there is no history", async () => {
    suggestionFor = () => ({ reps: null, weight: null, weightUnit: null });
    await renderSets([makeSet("1")]);
    expect(input(0, "reps").props.placeholder).toBe("10");
    expect(acceptButton(0).props.disabled).toBe(true);
  });

  test("shows the accepted value over a cleared draft in the focused field", async () => {
    await renderSets([makeSet("1")]);
    await enter(0, "reps", "8");
    await enter(0, "reps", "");
    await act(() => acceptButton(0).props.onPress());
    expect(input(0, "reps").props.value).toBe("6");
  });

  test("adds the next unilateral pair during a live workout when auto-add is on", async () => {
    mode = "live";
    settings = { autoAddSet: true };
    await renderSets([makeSet("R", { side: "R" }), makeSet("L", { side: "L" })], true);
    await act(() => acceptButton(0).props.onPress());
    expect(exercise.sets).toHaveLength(4);
    expect(exercise.sets[0]).toMatchObject({ reps: 6, weight: 220 });
  });

  test("adds the next set during a live workout when auto-add is on", async () => {
    mode = "live";
    settings = { autoAddSet: true };
    await renderSets([makeSet("1")]);
    await act(() => acceptButton(0).props.onPress());
    expect(exercise.sets).toHaveLength(2);
    expect(exercise.sets[0]).toMatchObject({ reps: 6, weight: 220 });
    expect(acceptButton(1).props.disabled).toBe(false);
  });
});

describe("set weight entry", () => {
  test.each([0, 1])("keeps a decimal point while typing in row %i", async (row) => {
    await renderSets([makeSet("1"), makeSet("2")]);
    await act(() => input(row, "weight").props.onFocus?.());
    await enter(row, "weight", "20");
    await enter(row, "weight", `${input(row, "weight").props.value}.`);
    expect(input(row, "weight").props.value).toBe("20.");
    await enter(row, "weight", `${input(row, "weight").props.value}5`);
    expect(input(row, "weight").props.value).toBe("20.5");
    expect(exercise.sets[row].weight).toBe(20.5);
  });

  test("accepts decimals in a duplicated set", async () => {
    await renderSets([makeSet("1", { reps: 10, weight: 20 })]);
    const copyIcon = renderer.root.findByProps({ name: "copy-outline" });
    await act(() => copyIcon.parent!.props.onPress());
    await act(() => input(1, "weight").props.onFocus?.());
    await enter(1, "weight", "20.");
    expect(input(1, "weight").props.value).toBe("20.");
    await enter(1, "weight", `${input(1, "weight").props.value}5`);
    expect(exercise.sets[1].weight).toBe(20.5);
    expect(exercise.sets[0].weight).toBe(20);
  });

  test("keeps leading and trailing decimal text until blur", async () => {
    await renderSets([makeSet("1")]);
    await act(() => input(0, "weight").props.onFocus?.());
    await enter(0, "weight", ".");
    expect(input(0, "weight").props.value).toBe(".");
    expect(exercise.sets[0].weight).toBeUndefined();
    await enter(0, "weight", ".50");
    expect(input(0, "weight").props.value).toBe(".50");
    expect(exercise.sets[0].weight).toBe(0.5);
    await act(() => input(0, "weight").props.onBlur());
    expect(input(0, "weight").props.value).toBe("0.5");
  });

  test("accepts the decimal separator used by comma keyboards", async () => {
    await renderSets([makeSet("1")]);
    await enter(0, "weight", "20,");
    expect(input(0, "weight").props.value).toBe("20,");
    await enter(0, "weight", "20,5");
    expect(exercise.sets[0].weight).toBe(20.5);
  });

  test("clears a value and rejects invalid numeric input", async () => {
    await renderSets([makeSet("1", { weight: 20 })]);
    for (const text of ["20..5", "NaN", "Infinity", "9".repeat(400)]) {
      await enter(0, "weight", text);
      expect(input(0, "weight").props.value).toBe("20");
      expect(exercise.sets[0].weight).toBe(20);
    }
    await enter(0, "weight", "");
    expect(input(0, "weight").props.value).toBe("");
    expect(exercise.sets[0].weight).toBeUndefined();
    await act(() => input(0, "weight").props.onBlur());
    expect(input(0, "weight").props.value).toBe("");
  });

  test("keeps drafts independent for unilateral rows", async () => {
    await renderSets([makeSet("R", { side: "R" }), makeSet("L", { side: "L" })], true);
    await enter(0, "weight", "20.");
    await enter(1, "weight", "22.5");
    expect(input(0, "weight").props.value).toBe("20.");
    expect(input(1, "weight").props.value).toBe("22.5");
    expect(exercise.sets.map((set) => set.weight)).toEqual([20, 22.5]);
  });

  test("shows external values after the field loses focus", async () => {
    await renderSets([makeSet("1", { weight: 20 })]);
    await enter(0, "weight", "20.");
    await act(() => input(0, "weight").props.onBlur());
    await act(() => updateExercise({ ...exercise, sets: [makeSet("1", { weight: 30 })] }));
    expect(input(0, "weight").props.value).toBe("30");
  });
});

describe("set rep entry", () => {
  test.each([0, 1])("accepts fractional reps and clearing in row %i", async (row) => {
    await renderSets([makeSet("1"), makeSet("2")]);
    await enter(row, "reps", "10.");
    expect(input(row, "reps").props.value).toBe("10.");
    await enter(row, "reps", `${input(row, "reps").props.value}5`);
    expect(exercise.sets[row].reps).toBe(10.5);
    await enter(row, "reps", "");
    expect(input(row, "reps").props.value).toBe("");
    expect(exercise.sets[row].reps).toBeUndefined();
  });

  test("rejects invalid reps without losing the previous value", async () => {
    await renderSets([makeSet("1")]);
    await enter(0, "reps", "10");
    expect(exercise.sets[0].reps).toBe(10);
    for (const text of ["10..5", "NaN", "Infinity"]) {
      await enter(0, "reps", text);
      expect(input(0, "reps").props.value).toBe("10");
      expect(exercise.sets[0].reps).toBe(10);
    }
  });
});
