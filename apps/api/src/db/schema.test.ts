import { describe, expect, test } from "bun:test";
import { userSets } from "./schema";

describe("userSets schema", () => {
  test("stores reps as a decimal value", () => {
    expect(userSets.reps.getSQLType()).toBe("numeric(10, 2)");
  });
});
