import "fake-indexeddb/auto";
import { clear } from "idb-keyval";
import { afterEach, describe, expect, it } from "vitest";
import {
	addExerciseSequence,
	getExerciseSequences,
} from "../../services/local-storage";
import { rankExercises } from "../useExerciseSuggestions";

/**
 * Integration tests: exercise sequence persistence → ranking suggestions.
 * Simulates real workout flows without React rendering.
 */
describe("exercise suggestions integration", () => {
	afterEach(async () => {
		await clear();
	});

	it("full flow: finish workouts, then get suggestions for a new one", async () => {
		// Simulate finishing 3 workouts
		await addExerciseSequence(["bench", "fly", "tricep-ext"]);
		await addExerciseSequence(["squat", "leg-press", "calf-raise"]);
		await addExerciseSequence(["bench", "fly", "ohp", "lateral-raise"]);

		const sequences = await getExerciseSequences();
		expect(sequences).toHaveLength(3);

		// New workout: user just added bench
		const suggestions = rankExercises(sequences, ["bench"]);

		// "fly" follows bench in sequences[0] (recency 0.85) and sequences[2] (recency 1.0)
		// It should be the top suggestion
		expect(suggestions[0]).toBe("fly");
		// Remaining suggestions should come from the two bench-containing sequences
		expect(suggestions).toContain("ohp");
		expect(suggestions).toContain("lateral-raise");
		expect(suggestions).toContain("tricep-ext");
	});

	it("suggestions update as user adds exercises mid-workout", async () => {
		await addExerciseSequence(["A", "B", "C", "D"]);
		await addExerciseSequence(["A", "B", "X", "Y"]);

		const sequences = await getExerciseSequences();

		// Step 1: just A
		const step1 = rankExercises(sequences, ["A"]);
		expect(step1[0]).toBe("B"); // B follows A in both sequences

		// Step 2: A + B
		const step2 = rankExercises(sequences, ["A", "B"]);
		// In seq[0] (most recent, recency 1.0): last match is B(idx 1), so X(idx 2) and Y(idx 3) follow
		// In seq[1] (older, recency 0.85): last match is B(idx 1), so C(idx 2) and D(idx 3) follow
		expect(step2[0]).toBe("X"); // recency 1.0, position 1.0
		expect(step2).toContain("C");
		expect(step2).toContain("Y");
		expect(step2).toContain("D");

		// Step 3: A + B + X
		const step3 = rankExercises(sequences, ["A", "B", "X"]);
		// In seq[0]: last match is X(idx 2), so Y(idx 3) follows
		// In seq[1]: last match is B(idx 1), C and D follow (X not in seq[1])
		expect(step3).toContain("Y");
		expect(step3).toContain("C");
		expect(step3).toContain("D");
	});

	it("cold start: no history gives no suggestions", async () => {
		const sequences = await getExerciseSequences();
		const suggestions = rankExercises(sequences, []);
		expect(suggestions).toEqual([]);
	});

	it("single workout history bootstraps suggestions", async () => {
		await addExerciseSequence(["deadlift", "row", "curl"]);

		const sequences = await getExerciseSequences();

		// Empty workout → suggest first exercise
		const empty = rankExercises(sequences, []);
		expect(empty).toEqual(["deadlift"]);

		// After adding deadlift → suggest row
		const afterFirst = rankExercises(sequences, ["deadlift"]);
		expect(afterFirst[0]).toBe("row");
	});

	it("evicted old sequences no longer influence suggestions", async () => {
		// Add an old sequence with unique exercise "old-ex"
		await addExerciseSequence(["A", "old-ex"]);

		// Fill up with 20 more sequences to evict the old one
		for (let i = 0; i < 20; i++) {
			await addExerciseSequence(["A", `new-${i}`]);
		}

		const sequences = await getExerciseSequences();
		expect(sequences).toHaveLength(20);

		const suggestions = rankExercises(sequences, ["A"]);
		expect(suggestions).not.toContain("old-ex");
	});
});
