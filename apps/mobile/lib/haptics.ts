/** A light tap. Loaded lazily so bun tests can render components without Expo's runtime. */
export function lightTap(): void {
  try {
    const Haptics = require("expo-haptics");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {
    // No haptics here (tests, web).
  }
}
