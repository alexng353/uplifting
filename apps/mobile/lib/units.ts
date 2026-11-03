// Pure so UI code and tests can convert without loading native storage.
export function convertWeight(weight: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === "kg" && toUnit === "lbs") {
    return Math.round(weight * 2.20462 * 10) / 10;
  }
  if (fromUnit === "lbs" && toUnit === "kg") {
    return Math.round((weight / 2.20462) * 10) / 10;
  }
  return weight;
}
