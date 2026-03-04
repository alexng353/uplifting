import { describe, expect, it } from "vitest";
import { rankExercises } from "../useExerciseSuggestions";

describe("rankExercises", () => {
	it("returns empty array when no sequences exist", () => {
		expect(rankExercises([], [])).toEqual([]);
	});

	it("suggests first exercises from history when workout is empty", () => {
		const sequences = [
			["A", "B", "C"],
			["A", "D", "E"],
			["B", "F", "G"],
		];
		const result = rankExercises(sequences, []);
		// A starts 2 workouts (most recent + second), B starts 1 (oldest)
		// A score = 1.0 + 0.85 = 1.85, B score = 0.85^2 = 0.7225
		expect(result[0]).toBe("A");
		expect(result[1]).toBe("B");
	});

	it("suggests the next exercise after current ones", () => {
		const sequences = [["A", "B", "C", "D"]];
		const result = rankExercises(sequences, ["A"]);
		// B is immediately after A (weight 1.0), C is 2 away (0.5), D is 3 away (0.333)
		expect(result).toEqual(["B", "C", "D"]);
	});

	it("excludes exercises already in the workout", () => {
		const sequences = [["A", "B", "C", "D"]];
		const result = rankExercises(sequences, ["A", "C"]);
		// lastMatchIdx = 2 (C), so only D follows. B is before C but already skipped.
		expect(result).toEqual(["D"]);
	});

	it("weights recent workouts higher than older ones", () => {
		// Recent workout ends with X, older workout ends with Y
		const sequences = [
			["A", "X"], // most recent → recency 1.0
			["A", "Y"], // older → recency 0.85
		];
		const result = rankExercises(sequences, ["A"]);
		expect(result[0]).toBe("X");
		expect(result[1]).toBe("Y");
	});

	it("aggregates scores across multiple sequences", () => {
		const sequences = [
			["A", "B"], // recency 1.0, B score = 1.0
			["A", "B"], // recency 0.85, B score += 0.85
			["A", "C"], // recency 0.7225, C score = 0.7225
		];
		const result = rankExercises(sequences, ["A"]);
		// B total = 1.85, C total = 0.7225
		expect(result[0]).toBe("B");
		expect(result[1]).toBe("C");
	});

	it("respects maxSuggestions limit", () => {
		const sequences = [["A", "B", "C", "D", "E", "F", "G"]];
		const result = rankExercises(sequences, ["A"], 3);
		expect(result).toHaveLength(3);
		expect(result).toEqual(["B", "C", "D"]);
	});

	it("handles sequences with no overlap to current workout", () => {
		const sequences = [["X", "Y", "Z"]];
		const result = rankExercises(sequences, ["A", "B"]);
		// No overlap → no suggestions
		expect(result).toEqual([]);
	});

	it("uses the last matching position in a sequence", () => {
		// If current has A and C, the last match in [A, B, C, D] is C (index 2)
		// So only D is suggested (not B, since it's before the last match)
		const sequences = [["A", "B", "C", "D"]];
		const result = rankExercises(sequences, ["A", "C"]);
		expect(result).toEqual(["D"]);
	});

	it("handles single-exercise sequences", () => {
		const sequences = [["A"]];
		const result = rankExercises(sequences, ["A"]);
		// A is matched at index 0, nothing follows
		expect(result).toEqual([]);
	});

	it("handles empty current exercises with single-item sequences", () => {
		const sequences = [["A"]];
		const result = rankExercises(sequences, []);
		expect(result).toEqual(["A"]);
	});

	it("position weight decays correctly for distant exercises", () => {
		// Two sequences: one where X immediately follows A, another where X is far away
		const sequences = [
			["B", "C", "D", "E", "A", "X"], // X is 1 away from A → posWeight 1.0
			["A", "Y", "Z", "X"], // X is 3 away from A → posWeight 0.333
		];
		const result = rankExercises(sequences, ["A"]);
		// X score = 1.0*1.0 + 0.85*(1/3) ≈ 1.283
		// Y score = 0.85*1.0 = 0.85
		// Z score = 0.85*0.5 = 0.425
		// E is before A in seq 0 so not suggested; C,D before A in seq 0
		expect(result[0]).toBe("X");
		expect(result[1]).toBe("Y");
		expect(result[2]).toBe("Z");
	});

	it("handles many sequences with exponential decay", () => {
		// Create 5 identical sequences, verify the scoring still works
		const sequences = Array.from({ length: 5 }, () => ["A", "B"]);
		const result = rankExercises(sequences, ["A"]);
		expect(result).toEqual(["B"]);
	});

	it("returns empty when all following exercises are already in workout", () => {
		const sequences = [["A", "B", "C"]];
		const result = rankExercises(sequences, ["A", "B", "C"]);
		expect(result).toEqual([]);
	});
});
