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
mock.module("../../hooks/useSideDefault", () => ({
  useSideDefault: (_id: string, fallback: string) => [fallback, () => {}],
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
const rowModeCalls: [number, string][] = [];

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
    addUnilateralPair: (
      _exerciseId: string,
      weightUnit: string,
      _reps?: number,
      _weight?: number,
      layout?: "combined",
    ) =>
      updateExercise({
        ...exercise,
        sets: [
          ...exercise.sets,
          makeSet(`R${exercise.sets.length}`, { weightUnit, side: "R", layout }),
          makeSet(`L${exercise.sets.length}`, { weightUnit, side: "L", layout }),
        ],
      }),
    trimTrailingEmptySets,
    setRowMode: (_exerciseId: string, row: number, mode: string) => rowModeCalls.push([row, mode]),
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
  test("unilateral is one reps/weight row and one tap fills both sides the same", async () => {
    mode = "live";
    settings = { autoAddSet: true };
    await renderSets(
      [
        makeSet("R", { side: "R", layout: "combined" }),
        makeSet("L", { side: "L", layout: "combined" }),
      ],
      true,
      "Barbell",
    );
    const inputs = renderer.root.findAllByType(TextInput);
    expect(inputs.map((i) => i.props.placeholder)).toEqual(["6", "220"]);
    await act(() => acceptButton(0).props.onPress());
    expect(exercise.sets.find((s) => s.id === "R")).toMatchObject({ reps: 6, weight: 220 });
    expect(exercise.sets.find((s) => s.id === "L")).toMatchObject({ reps: 6, weight: 220 });
    // Typing also writes both sides.
    await act(() => renderer.root.findAllByType(TextInput)[1].props.onChangeText("225"));
    expect(exercise.sets.filter((s) => s.id === "R" || s.id === "L").map((s) => s.weight)).toEqual([
      225, 225,
    ]);
  });

  test("tapping a set number cycles that row bilateral, unilateral, split", async () => {
    rowModeCalls.length = 0;
    await renderSets(
      [
        makeSet("b", { reps: 8, weight: 60 }),
        makeSet("R", { side: "R", layout: "combined", reps: 8, weight: 20 }),
        makeSet("L", { side: "L", layout: "combined", reps: 8, weight: 20 }),
        makeSet("R2", { side: "R", reps: 8 }),
        makeSet("L2", { side: "L" }),
      ],
      true,
    );
    const cells = renderer.root.findAll(
      (n) => n.props.testID === "set-mode" && typeof n.type === "string",
    );
    expect(cells.map((c) => c.props.accessibilityLabel)).toEqual([
      "Set 1, Bilateral. Tap for Unilateral",
      "Set 2, Unilateral. Tap for Split",
      "Set 3, Split. Tap for Bilateral",
    ]);
    for (const cell of cells) await act(() => cell.props.onPress());
    expect(rowModeCalls).toEqual([
      [0, "unilateral"],
      [1, "split"],
      [2, "bilateral"],
    ]);
  });

  describe("ghost sets", () => {
    const host = (id: string) =>
      renderer.root.findAll((n) => n.props.testID === id && typeof n.type === "string");
    const set = (id: string) => exercise.sets.find((s) => s.id === id)!;
    const pick = (s: StoredSet) => [s.reps, s.weight];

    test("are drawn as ghosts, and their number fills them instead of cycling", async () => {
      rowModeCalls.length = 0;
      await renderSets([makeSet("a", { reps: 5, weight: 100 }), makeSet("g")]);
      expect(host("ghost-row")).toHaveLength(1);
      expect(host("set-mode")).toHaveLength(1); // only the real row cycles
      const [ghostNumber] = host("make-real");
      expect(ghostNumber.props.accessibilityLabel).toBe(
        "Set 2, not logged yet. Tap to fill it from last time",
      );
      await act(() => ghostNumber.props.onPress());
      expect(pick(set("g"))).toEqual([6, 220]);
      expect(rowModeCalls).toEqual([]);
      expect(host("ghost-row")).toHaveLength(0);
    });

    test("a unilateral ghost fills both sides the same; a split ghost fills each side", async () => {
      await renderSets(
        [
          makeSet("uR", { side: "R", layout: "combined" }),
          makeSet("uL", { side: "L", layout: "combined" }),
        ],
        true,
      );
      await act(() => host("make-real")[0].props.onPress());
      expect([pick(set("uR")), pick(set("uL"))]).toEqual([
        [6, 220],
        [6, 220],
      ]);
      await act(() => renderer.unmount());

      await renderSets([makeSet("sR", { side: "R" }), makeSet("sL", { side: "L" })], true);
      await act(() => host("make-real")[0].props.onPress());
      expect([pick(set("sR")), pick(set("sL"))]).toEqual([
        [6, 220],
        [5, 100],
      ]);
    });

    test("without history a ghost copies the last filled set", async () => {
      suggestionFor = () => ({ reps: null, weight: null, weightUnit: null });
      await renderSets([makeSet("a", { reps: 7, weight: 80 }), makeSet("g")]);
      await act(() => host("make-real")[0].props.onPress());
      expect(pick(set("g"))).toEqual([7, 80]);
    });

    test.each([
      ["bilateral", [makeSet("g")], "g", ["g"]],
      [
        "unilateral",
        [
          makeSet("R", { side: "R", layout: "combined" }),
          makeSet("L", { side: "L", layout: "combined" }),
        ],
        "R",
        ["R", "L"],
      ],
      ["split", [makeSet("R", { side: "R" }), makeSet("L", { side: "L" })], "R", ["R"]],
    ] as const)(
      "typing into a %s ghost's weight makes it real with exactly what was typed",
      async (_mode, sets, _first, written) => {
        await renderSets([...sets], true);
        const field = input(0, "weight");
        // The suggestion is only a placeholder: the field starts empty, so the first
        // keystroke lands in it rather than appending to the grey number.
        expect(field.props.value).toBe("");
        expect(field.props.placeholder).toBe("220");
        await act(() => field.props.onFocus?.({}));
        await enter(0, "weight", "1");
        await enter(0, "weight", "15");
        await enter(0, "weight", "150");
        expect(input(0, "weight").props.value).toBe("150");
        for (const id of written) expect(set(id).weight).toBe(150);
        expect(host("ghost-row").length).toBeLessThan(sets.length);
      },
    );
  });

  test("a mixed exercise shows a bilateral row then a one-row L/R set", async () => {
    await renderSets(
      [
        makeSet("b"),
        makeSet("R", { side: "R", layout: "combined" }),
        makeSet("L", { side: "L", layout: "combined" }),
      ],
      true,
    );
    // 2 inputs per row: unilateral is a single reps/weight row; one check each.
    expect(renderer.root.findAllByType(TextInput)).toHaveLength(4);
    expect(
      renderer.root.findAll(
        (n) => n.props.testID === "accept-suggestion" && typeof n.type === "string",
      ),
    ).toHaveLength(2);
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

  test("copy fills a trailing empty row from the last filled set", async () => {
    await renderSets([
      makeSet("1", { reps: 6, weight: 100 }),
      makeSet("2", { reps: 6, weight: 150 }),
      makeSet("3"),
    ]);
    const copyIcon = renderer.root.findByProps({ name: "copy-outline" });
    await act(() => copyIcon.parent!.props.onPress());
    expect(exercise.sets).toHaveLength(3);
    expect(exercise.sets[2]).toMatchObject({ reps: 6, weight: 150 });
  });

  test("copy keeps each side of a split set", async () => {
    await renderSets(
      [
        makeSet("R1", { side: "R", reps: 8, weight: 20 }),
        makeSet("L1", { side: "L", reps: 7, weight: 18 }),
        makeSet("R2", { side: "R" }),
        makeSet("L2", { side: "L" }),
      ],
      true,
    );
    const copyIcon = renderer.root.findByProps({ name: "copy-outline" });
    await act(() => copyIcon.parent!.props.onPress());
    expect(exercise.sets.find((s) => s.id === "R2")).toMatchObject({ reps: 8, weight: 20 });
    expect(exercise.sets.find((s) => s.id === "L2")).toMatchObject({ reps: 7, weight: 18 });
  });

  test("copy appends when the last row is filled (decimals)", async () => {
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
