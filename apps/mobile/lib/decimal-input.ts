export function parseDecimalInput(text: string): { isValid: boolean; value: number | undefined } {
  if (!/^\d*\.?\d*$/.test(text)) {
    return { isValid: false, value: undefined };
  }

  if (text === "" || text === ".") {
    return { isValid: true, value: undefined };
  }

  return { isValid: true, value: Number(text) };
}

export function formatDecimalInput(value: number | undefined): string {
  return value != null ? String(value) : "";
}
