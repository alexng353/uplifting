import { useColorScheme } from "nativewind";

// Ember (redesign accent). The deeper shade keeps contrast on light backgrounds.
const EMBER = "#F2894B";
const EMBER_DEEP = "#B85B26";

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
    accentIcon: dark ? EMBER : EMBER_DEEP,
    mutedIcon: dark ? "#71717a" : "#a1a1aa",
    chevron: dark ? "#71717a" : "#a1a1aa",
    dangerIcon: "#ef4444",
    successIcon: "#22c55e",
    // The usual-last-set ring is a "next" cue, so Ember; yellow now means "same as last time".
    targetSet: dark ? EMBER : EMBER_DEEP,
    warningIcon: "#f59e0b",
    /** Text and icons on an Ember fill. */
    onAccent: "#1F0E04",

    // Inputs
    placeholder: dark ? "#52525b" : "#a1a1aa",
    inputBorder: dark ? "#3f3f46" : "#d4d4d8",
    // A bright caret: the system blue is hard to see on zinc-800 fields.
    caret: dark ? EMBER : EMBER_DEEP,

    // Switch
    switchTrackFalse: dark ? "#3f3f46" : "#d4d4d8",
    switchTrackTrue: "#F7A670",
    switchThumbOn: EMBER,
    switchThumbOff: dark ? "#27272a" : "#f4f4f5",

    // Misc
    shadowColor: "#000000",
    inactiveIndicator: dark ? "#3f3f46" : "#d4d4d8",
    activeIndicator: EMBER,
    separator: dark ? "#27272a" : "#e4e4e7",

    // Side labels (ExerciseSlide): R sky, L violet, as in the redesign; neither is Ember.
    rightSideBg: dark ? "#12304A" : "#DCEEFF",
    rightSideText: dark ? "#5DB4FF" : "#1F6FB8",
    leftSideBg: dark ? "#2A2142" : "#EDE6FF",
    leftSideText: dark ? "#B89CFF" : "#6B4FD0",

    // Tab bar
    tabBarBg: dark ? "#18181b" : "#ffffff",
    tabBarBorder: dark ? "#27272a" : "#e4e4e7",
    tabActiveTint: dark ? EMBER : EMBER_DEEP,
    tabInactiveTint: dark ? "#636366" : "#8e8e93",
  };
}
