import { useColorScheme } from "nativewind";

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";

  return {
    // Backgrounds
    cardBg: dark ? "#18181b" : "#ffffff",
    subtleBg: dark ? "#27272a" : "#f4f4f5",
    pageBg: dark ? "#09090b" : "#fafafa",

    // Text
    primaryText: dark ? "#fafafa" : "#18181b",
    secondaryText: dark ? "#a1a1aa" : "#71717a",
    tertiaryText: dark ? "#71717a" : "#a1a1aa",

    // Icons
    accentIcon: "#3b82f6",
    mutedIcon: dark ? "#71717a" : "#a1a1aa",
    chevron: dark ? "#71717a" : "#a1a1aa",
    dangerIcon: "#ef4444",
    successIcon: "#22c55e",
    warningIcon: "#f59e0b",

    // Inputs
    placeholder: dark ? "#52525b" : "#a1a1aa",
    inputBorder: dark ? "#3f3f46" : "#d4d4d8",

    // Switch
    switchTrackFalse: dark ? "#3f3f46" : "#d4d4d8",
    switchTrackTrue: "#93c5fd",
    switchThumbOn: "#3b82f6",
    switchThumbOff: dark ? "#27272a" : "#f4f4f5",

    // Misc
    shadowColor: "#000000",
    inactiveIndicator: dark ? "#3f3f46" : "#d4d4d8",
    activeIndicator: "#3b82f6",
    separator: dark ? "#27272a" : "#e4e4e7",

    // Side labels (ExerciseSlide)
    rightSideBg: dark ? "#1e3a5f" : "#dbeafe",
    rightSideText: dark ? "#93c5fd" : "#2563eb",
    leftSideBg: dark ? "#451a03" : "#fef3c7",
    leftSideText: dark ? "#fcd34d" : "#d97706",

    // Tab bar
    tabBarBg: dark ? "#18181b" : "#ffffff",
    tabBarBorder: dark ? "#27272a" : "#e4e4e7",
    tabActiveTint: dark ? "#0a84ff" : "#007AFF",
    tabInactiveTint: dark ? "#636366" : "#8e8e93",
  };
}
