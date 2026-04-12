# Dark Mode — Full App Implementation

## Overview

Add a 3-way dark mode toggle (Light / Dark / System) to the mobile app. Every screen and component gets dark variants. The setting persists locally via `useSettings` and syncs to the server.

## Theme State & Storage

- Add `colorScheme: "light" | "dark" | "system"` to `StoredSettings` in `useSettings.tsx`
- Default value: `"system"`
- No new context or provider needed — NativeWind's built-in color scheme mechanism handles propagation

## NativeWind Configuration

- `tailwind.config.js`: Add `darkMode: "class"` so NativeWind respects the `dark` className on the root view
- `_layout.tsx`: Use NativeWind's `useColorScheme()` hook to imperatively set the active scheme:
  - When setting is `"system"` — follow device preference via `Appearance.getColorScheme()`
  - When `"light"` or `"dark"` — force that scheme via `setColorScheme()`
- This is called once in `RootLayout` after storage hydration

## Settings UI

- Add a `PickerRow` in the existing **Appearance** section of `settings/index.tsx`
- Options: Light, Dark, System
- Placed above the existing rep range color picker
- Updates `colorScheme` via `updateSettings()`

## Dark Palette Mapping

All screens use Tailwind `dark:` variant classes:

| Light Class                   | Dark Variant              |
| ----------------------------- | ------------------------- |
| `bg-white`                    | `dark:bg-zinc-900`        |
| `bg-zinc-50`                  | `dark:bg-zinc-950`        |
| `bg-zinc-100`                 | `dark:bg-zinc-800`        |
| `bg-zinc-200`                 | `dark:bg-zinc-700`        |
| `border-zinc-100`             | `dark:border-zinc-800`    |
| `border-zinc-200`             | `dark:border-zinc-700`    |
| `border-zinc-300`             | `dark:border-zinc-600`    |
| `text-zinc-900`               | `dark:text-zinc-50`       |
| `text-zinc-700`               | `dark:text-zinc-200`      |
| `text-zinc-600`               | `dark:text-zinc-300`      |
| `text-zinc-500`               | `dark:text-zinc-400`      |
| `text-zinc-400`               | `dark:text-zinc-500`      |
| `active:bg-zinc-50`           | `dark:active:bg-zinc-800` |
| `bg-gray-300` (login borders) | `dark:border-zinc-600`    |
| `text-gray-500`               | `dark:text-zinc-400`      |

Accent colors (blue-500, red-500, green-500, amber-\*) remain unchanged — they have sufficient contrast on both light and dark backgrounds.

Semantic/status backgrounds that already use color (e.g. `bg-red-50`, `bg-green-50`, `bg-blue-50`, `bg-amber-100`) get dark variants:

| Light          | Dark                |
| -------------- | ------------------- |
| `bg-red-50`    | `dark:bg-red-950`   |
| `bg-green-50`  | `dark:bg-green-950` |
| `bg-blue-50`   | `dark:bg-blue-950`  |
| `bg-amber-100` | `dark:bg-amber-950` |

## Inline Style Colors — `useThemeColors` Hook

A new `hooks/useThemeColors.ts` hook returns the correct hex values for the ~15 spots that use inline `style=` props (icons, placeholders, shadows, switch tracks). It reads the current color scheme from NativeWind's `useColorScheme()`.

Returns an object like:

```ts
{
  // Backgrounds
  cardBg: "#ffffff" | "#18181b",        // white / zinc-900
  subtleBg: "#f4f4f5" | "#27272a",     // zinc-100 / zinc-800

  // Text
  primaryText: "#18181b" | "#fafafa",   // zinc-900 / zinc-50
  secondaryText: "#71717a" | "#a1a1aa", // zinc-500 / zinc-400
  tertiaryText: "#a1a1aa" | "#71717a",  // zinc-400 / zinc-500

  // Icons
  mutedIcon: "#a1a1aa" | "#71717a",     // zinc-400 / zinc-500
  chevron: "#a1a1aa" | "#71717a",

  // Inputs
  placeholder: "#a1a1aa" | "#52525b",   // zinc-400 / zinc-600
  inputBorder: "#d4d4d8" | "#3f3f46",   // zinc-300 / zinc-700

  // Switch
  switchTrackFalse: "#d4d4d8" | "#3f3f46",
  switchTrackTrue: "#93c5fd" | "#93c5fd",
  switchThumbOn: "#3b82f6" | "#3b82f6",
  switchThumbOff: "#f4f4f5" | "#27272a",

  // Shadows
  shadowColor: "#000000",              // same in both modes

  // Slide indicators
  inactiveIndicator: "#d4d4d8" | "#3f3f46",
}
```

## Tab Bar

In `(tabs)/_layout.tsx`, set tab bar colors reactively:

- **Light**: `tabBarStyle: { backgroundColor: "#fff" }`, active tint `#007AFF`, inactive tint `#8e8e93`
- **Dark**: `tabBarStyle: { backgroundColor: "#18181b" }`, active tint `#0a84ff`, inactive tint `#636366`

## Files Changed

### New files

- `apps/mobile/hooks/useThemeColors.ts` — inline color hook

### Modified files (plumbing)

- `apps/mobile/tailwind.config.js` — add `darkMode: "class"`
- `apps/mobile/hooks/useSettings.tsx` — add `colorScheme` to `StoredSettings`
- `apps/mobile/app/_layout.tsx` — wire up color scheme after hydration
- `apps/mobile/app/(tabs)/_layout.tsx` — dark tab bar styles

### Modified files (dark variants on all screens/components — 27 files)

- `apps/mobile/app/login.tsx`
- `apps/mobile/app/(tabs)/me.tsx`
- `apps/mobile/app/(tabs)/workout.tsx`
- `apps/mobile/app/(tabs)/friends.tsx`
- `apps/mobile/app/(tabs)/stats/index.tsx`
- `apps/mobile/app/(tabs)/stats/workout/[workoutId].tsx`
- `apps/mobile/app/(tabs)/stats/exercise/[exerciseId].tsx`
- `apps/mobile/app/(tabs)/settings/index.tsx`
- `apps/mobile/app/(tabs)/settings/exercise-profiles.tsx`
- `apps/mobile/app/(tabs)/settings/rep-ranges.tsx`
- `apps/mobile/components/WeekStreak.tsx`
- `apps/mobile/components/SyncBanner.tsx`
- `apps/mobile/components/workout/RestTimer.tsx`
- `apps/mobile/components/workout/ExerciseSlide.tsx`
- `apps/mobile/components/workout/WorkoutSummary.tsx`
- `apps/mobile/components/workout/AddExerciseSlide.tsx`
- `apps/mobile/components/workout/ReorderModal.tsx`
- `apps/mobile/components/friends/FriendSearch.tsx`
- `apps/mobile/components/friends/FeedCard.tsx`
- `apps/mobile/components/friends/FriendsList.tsx`
- `apps/mobile/components/friends/PendingRequests.tsx`
- `apps/mobile/components/friends/FriendProfile.tsx`
- `apps/mobile/components/settings/GymManagerModal.tsx`

## Non-Goals

- No server-side API changes — `colorScheme` syncs via the existing settings PUT endpoint
- No custom theme colors beyond the zinc palette — accent colors stay as-is
- No per-screen theme overrides — one global setting
