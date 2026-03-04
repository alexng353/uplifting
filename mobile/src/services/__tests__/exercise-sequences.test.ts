import "fake-indexeddb/auto";
import { clear } from "idb-keyval";
import { afterEach, describe, expect, it } from "vitest";
import { addExerciseSequence, getExerciseSequences } from "../local-storage";

describe("exercise sequence storage", () => {
	afterEach(async () => {
		await clear();
	});

	it("returns empty array when no sequences stored", async () => {
		const result = await getExerciseSequences();
		expect(result).toEqual([]);
	});

	it("stores and retrieves a sequence", async () => {
		await addExerciseSequence(["A", "B", "C"]);
		const result = await getExerciseSequences();
		expect(result).toEqual([["A", "B", "C"]]);
	});

	it("prepends new sequences (most recent first)", async () => {
		await addExerciseSequence(["A", "B"]);
		await addExerciseSequence(["C", "D"]);
		const result = await getExerciseSequences();
		expect(result).toEqual([
			["C", "D"],
			["A", "B"],
		]);
	});

	it("ignores empty sequences", async () => {
		await addExerciseSequence([]);
		const result = await getExerciseSequences();
		expect(result).toEqual([]);
	});

	it("caps at 20 sequences", async () => {
		for (let i = 0; i < 25; i++) {
			await addExerciseSequence([`exercise-${i}`]);
		}
		const result = await getExerciseSequences();
		expect(result).toHaveLength(20);
		// Most recent should be first
		expect(result[0]).toEqual(["exercise-24"]);
		// Oldest kept should be exercise-5 (0-4 were evicted)
		expect(result[19]).toEqual(["exercise-5"]);
	});

	it("preserves exercise order within a sequence", async () => {
		const sequence = ["squat", "bench", "deadlift", "ohp", "row"];
		await addExerciseSequence(sequence);
		const result = await getExerciseSequences();
		expect(result[0]).toEqual(sequence);
	});
});
