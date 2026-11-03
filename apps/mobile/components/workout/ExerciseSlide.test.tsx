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
mock.module("react-native-keyboard-controller", () => ({ KeyboardAwareScrollView: "ScrollView" }));
mock.module("../../hooks/useThemeColors", () => ({ useThemeColors: () => ({}) }));
let settings: Record<string, unknown> = {};
let mode = "editing";
const HISTORY: SetSuggestion = { reps: 6, weight: 220, weightUnit: "kg" };
const LEFT_HISTORY: SetSuggestion = { reps: 5, weight: 100, weightUnit: "kg" };
let suggestionFor = (_setNumber: number, side?: "L" | "R"): SetSuggestion =>
  side === "L" ? LEFT_HISTORY : HISTORY;
let target: number | null = null;
mock.module("../../hooks/useSettings", () => ({
  useSettings: () => ({ settings, getDisplayUnit: () => "kg" }),
}));
mock.module("../../hooks/usePreviousSets", () => ({
  usePreviousSets: () => ({
    getSuggestion: (_exerciseId: string, _profileId: string, setNumber: number, side?: "L" | "R") =>
      suggestionFor(setNumber, side),
    getTargetSetCount: () => target,
  }),
}));
let profiles: Array<{ id: string; name: string }> = [];
mock.module("../../hooks/useExerciseProfiles", () => ({
  useExerciseProfiles: () => ({ data: profiles }),
  useCreateExerciseProfile: () => ({}),
  useRenameExerciseProfile: () => ({}),
}));
mock.module("../../hooks/useExerciseNotes", () => ({
  useExerciseNotes: () => ({}),
  useSetExerciseNote: () => ({}),
}));
mock.module("../../hooks/useGymProfileSuggestion", () => ({
  useGymProfileSuggestion: () => ({
    getSuggestedProfile: () => "black",
    currentGymId: "golds",
    recordProfileUsage: () => {},
  }),
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
const sideModeCalls: string[] = [];

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
    setSideMode: (_exerciseId: string, mode: string) => sideModeCalls.push(mode),
    changeExerciseProfile: (
      _exerciseId: string,
      profileId: string | undefined,
      exerciseName: string,
    ) => updateExercise({ ...exercise, profileId, exerciseName }),
  }),
}));

const { default: ExerciseSlide } = await import("./ExerciseSlide");
const { TextInput } = await import("react-native");

function makeSet(id: string, values: Partial<StoredSet> = {}): StoredSet {
  return { id, weightUnit: "kg", createdAt: "2026-09-06T12:00:00Z", ...values };
}

let renderer: ReactTestRenderer;

async function renderSets(
  sets: StoredSet[],
  isUnilateral = false,
  exerciseType?: string,
  sideLayout?: "split" | "combined",
) {
  function Harness() {
    const [state, setState] = useState<StoredWorkoutExercise>({
      exerciseId: "exercise",
      exerciseName: "Squat",
      sets,
      isUnilateral,
      exerciseType,
      sideLayout,
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
  target = null;
  suggestionFor = (_setNumber, side) => (side === "L" ? LEFT_HISTORY : HISTORY);
  profiles = [];
});

describe("profile names", () => {
  async function renderProfiled(exerciseName: string) {
    function Harness() {
      const [state, setState] = useState<StoredWorkoutExercise>({
        exerciseId: "press",
        exerciseName,
        profileId: "black",
        sets: [makeSet("1")],
      });
      exercise = state;
      setExerciseState = setState;
      return <ExerciseSlide exercise={state} />;
    }
    await act(() => {
      renderer = create(<Harness />);
    });
  }
  const texts = () =>
    renderer.root.findAllByType("Text" as never).map((t) => [t.props.children].flat().join(""));

  test("heals a title that saved the picker hint, and the stored name with it", async () => {
    profiles = [{ id: "black", name: "Black machine broadway" }];
    await renderProfiled("Machine Shoulder Press (Black machine broadway (last used here))");
    expect(texts()).toContain("Machine Shoulder Press (Black machine broadway)");
    expect(texts().some((t) => t.includes("last used here"))).toBe(false);
    expect(exercise.exerciseName).toBe("Machine Shoulder Press (Black machine broadway)");
  });

  test("the picker shows the hint as a note and selects the clean name", async () => {
    profiles = [{ id: "black", name: "Black machine broadway" }];
    await renderProfiled("Machine Shoulder Press (Black machine broadway)");
    const menu = renderer.root.findByProps({ name: "ellipsis-horizontal-circle" }).parent!;
    await act(() => menu.props.onPress());
    expect(texts()).toContain("Profile for Machine Shoulder Press");
    const list = renderer.root.findByType("FlatList" as never);
    let row!: ReactTestRenderer;
    await act(() => {
      row = create(list.props.renderItem({ item: list.props.data[1] }));
    });
    const rowTexts = row.root
      .findAllByType("Text" as never)
      .map((t) => [t.props.children].flat().join(""));
    expect(rowTexts).toEqual(["Black machine broadway", "Last used at this gym"]);
    await act(() => row.root.findAllByType("Pressable" as never)[0].props.onPress());
    expect(exercise.exerciseName).toBe("Machine Shoulder Press (Black machine broadway)");
  });

  test("a renamed profile renames the title", async () => {
    profiles = [{ id: "black", name: "Hammer Strength" }];
    await renderProfiled("Machine Shoulder Press (Black machine broadway)");
    expect(exercise.exerciseName).toBe("Machine Shoulder Press (Hammer Strength)");
  });
});

function acceptButton(row: number) {
  return renderer.root.findAll(
    (node) => node.props.testID === "accept-suggestion" && typeof node.type === "string",
  )[row];
}

describe("accept suggestion", () => {
  test("unilateral shows L then R in one row and one tap fills both sides", async () => {
    mode = "live";
    settings = { autoAddSet: true };
    await renderSets(
      [makeSet("R", { side: "R" }), makeSet("L", { side: "L" })],
      true,
      "Barbell",
      "combined",
    );
    const inputs = renderer.root.findAllByType(TextInput);
    expect(inputs.map((i) => i.props.placeholder)).toEqual(["5", "100", "6", "220"]);
    expect(
      renderer.root.findAll(
        (n) => n.props.testID === "accept-suggestion" && typeof n.type === "string",
      ),
    ).toHaveLength(1);
    await act(() => acceptButton(0).props.onPress());
    const left = exercise.sets.find((s) => s.id === "L");
    const right = exercise.sets.find((s) => s.id === "R");
    expect(left).toMatchObject({ reps: 5, weight: 100 });
    expect(right).toMatchObject({ reps: 6, weight: 220 });
    // Auto-add opens exactly one new pair.
    expect(exercise.sets).toHaveLength(4);
  });

  test("the three-way control shows the current mode and asks for a new one", async () => {
    sideModeCalls.length = 0;
    await renderSets([makeSet("R", { side: "R" }), makeSet("L", { side: "L" })], true, "Barbell");
    const option = (m: string) =>
      renderer.root.findAll(
        (n) => n.props.testID === `side-mode-${m}` && typeof n.type === "string",
      )[0];
    expect(option("split").props.accessibilityState).toEqual({ selected: true });
    expect(option("unilateral").props.accessibilityState).toEqual({ selected: false });
    await act(() => option("unilateral").props.onPress());
    await act(() => option("split").props.onPress());
    expect(sideModeCalls).toEqual(["unilateral"]);
  });

  test("rings the usual last set, green once it is filled", async () => {
    target = 2;
    await renderSets([makeSet("1"), makeSet("2"), makeSet("3")]);
    const rings = () =>
      renderer.root.findAll((n) => n.props.testID === "target-set" && typeof n.type === "string");
    expect(rings()).toHaveLength(1);
    expect(rings()[0].props.accessibilityLabel).toBe("Set 2, your usual last set");
    await act(() => acceptButton(1).props.onPress());
    expect(rings()[0].props.accessibilityLabel).toBe("Set 2, your usual last set, done");
  });

  test("shows no ring without history", async () => {
    await renderSets([makeSet("1")]);
    expect(renderer.root.findAll((n) => n.props.testID === "target-set")).toHaveLength(0);
  });

  test("rings only the right row of a unilateral target pair", async () => {
    target = 1;
    await renderSets([makeSet("R", { side: "R" }), makeSet("L", { side: "L" })], true);
    expect(
      renderer.root.findAll((n) => n.props.testID === "target-set" && typeof n.type === "string"),
    ).toHaveLength(1);
  });

  test("a unilateral target turns green only when both sides are in", async () => {
    target = 1;
    await renderSets([makeSet("R", { side: "R" }), makeSet("L", { side: "L" })], true);
    const ring = () =>
      renderer.root.findAll(
        (n) => n.props.testID === "target-set" && typeof n.type === "string",
      )[0];
    await act(() => acceptButton(0).props.onPress());
    expect(ring().props.accessibilityLabel).toBe("Set 1, your usual last set");
    await act(() => acceptButton(1).props.onPress());
    expect(ring().props.accessibilityLabel).toBe("Set 1, your usual last set, done");
  });

  test("a reps-only bodyweight target counts as done", async () => {
    target = 1;
    await renderSets([makeSet("1", { reps: 12 })], false, "Bodyweight");
    expect(
      renderer.root.findAll((n) => n.props.testID === "target-set" && typeof n.type === "string")[0]
        .props.accessibilityLabel,
    ).toBe("Set 1, your usual last set, done");
  });

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
