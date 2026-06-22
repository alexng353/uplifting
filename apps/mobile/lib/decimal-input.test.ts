import { describe, expect, test } from "bun:test";
import { parseDecimalInput } from "./decimal-input";

describe("parseDecimalInput", () => {
  test("allows partial decimal input while preserving numeric updates", () => {
    expect(parseDecimalInput("2.")).toEqual({ isValid: true, value: 2 });
    expect(parseDecimalInput("2.5")).toEqual({ isValid: true, value: 2.5 });
  });

  test("treats empty or decimal-only input as cleared", () => {
    expect(parseDecimalInput("")).toEqual({ isValid: true, value: undefined });
    expect(parseDecimalInput(".")).toEqual({ isValid: true, value: undefined });
  });
});
