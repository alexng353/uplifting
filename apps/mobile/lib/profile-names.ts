// A workout stores an exercise with a profile as "Base (Profile)". These helpers keep
// that string derived from data, never from picker labels.

const PICKER_HINT = /\s*\(last used here\)/g;

export function exerciseTitle(baseName: string, profileName?: string | null): string {
  return profileName ? `${baseName} (${profileName})` : baseName;
}

/**
 * The base exercise name from a stored "Base (Profile)" string. Strips one balanced
 * trailing group, so nested names like "Press (Black (last used here))" come out clean.
 */
export function stripProfileSuffix(name: string): string {
  const trimmed = name.trimEnd();
  if (!trimmed.endsWith(")")) return trimmed;
  let depth = 0;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (trimmed[i] === ")") depth++;
    else if (trimmed[i] === "(" && --depth === 0) {
      const base = trimmed.slice(0, i).trimEnd();
      return base || trimmed;
    }
  }
  return trimmed;
}

/** Removes the picker-only hint that older builds saved into names. */
export function withoutPickerHint(name: string): string {
  return name.replace(PICKER_HINT, "");
}
