import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Keyboard, Pressable, Text, View, useWindowDimensions, type TextInput } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../../hooks/useThemeColors";
import {
  KEYBOARD_BAR_HEIGHT,
  SetFieldFocusContext,
  type SetFieldFocus,
} from "../../hooks/useSetFieldFocus";
import { neighbourStop, setFieldOrder } from "../../lib/set-field-order";
import type { StoredWorkoutExercise } from "../../services/storage";

// Fallback if the pager never reports the new page (e.g. it was already there).
const PAGE_SETTLE_MS = 600;

/**
 * Safari-style Previous / Next / Done bar above the number pad for set inputs.
 * The order comes from the workout data, so it never wanders into the exercise
 * search box or a hidden page, and crossing exercises turns the pager first.
 */
export default function SetFieldNavigator({
  exercises,
  activeExerciseIndex,
  showExercise,
  children,
}: {
  exercises: StoredWorkoutExercise[];
  /** The exercise page on screen now; the user may have swiped while typing. */
  activeExerciseIndex: number;
  showExercise: (exerciseIndex: number) => void;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  const inputs = useRef(new Map<string, TextInput>());
  const focusedRef = useRef<string | null>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const containerRef = useRef<View>(null);
  const [bottomGap, setBottomGap] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  const stops = useMemo(() => setFieldOrder(exercises), [exercises]);
  const pendingFocus = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Field to focus once the pager shows its exercise; focusing mid-scroll is dropped.
  const pendingKey = useRef<string | null>(null);
  const clearPendingFocus = () => {
    if (pendingFocus.current) clearTimeout(pendingFocus.current);
    pendingFocus.current = null;
    pendingKey.current = null;
  };
  useEffect(() => clearPendingFocus, []);

  useEffect(() => {
    const key = pendingKey.current;
    if (!key) return;
    if (stops.find((stop) => stop.key === key)?.exerciseIndex !== activeExerciseIndex) return;
    clearPendingFocus();
    requestAnimationFrame(() => inputs.current.get(key)?.focus());
  }, [activeExerciseIndex, stops]);

  const focus = useMemo<SetFieldFocus>(
    () => ({
      register: (key, input) => {
        if (input) inputs.current.set(key, input);
        else inputs.current.delete(key);
      },
      focused: (key) => {
        focusedRef.current = key;
        setFocusedKey(key);
      },
      // Moving between fields blurs one and focuses the next; only hide when nothing took over.
      blurred: (key) => {
        setTimeout(() => {
          if (focusedRef.current !== key) return;
          focusedRef.current = null;
          setFocusedKey(null);
        }, 0);
      },
    }),
    [],
  );

  const move = useCallback(
    (direction: 1 | -1) => {
      const target = neighbourStop(stops, focusedRef.current, direction);
      if (!target) return;
      clearPendingFocus();
      const focusTarget = () => inputs.current.get(target.key)?.focus();
      if (target.exerciseIndex === activeExerciseIndex) {
        focusTarget();
      } else {
        pendingKey.current = target.key;
        showExercise(target.exerciseIndex);
        pendingFocus.current = setTimeout(() => {
          pendingKey.current = null;
          focusTarget();
        }, PAGE_SETTLE_MS);
      }
    },
    [stops, showExercise, activeExerciseIndex],
  );

  const hasPrev = neighbourStop(stops, focusedKey, -1) != null;
  const hasNext = neighbourStop(stops, focusedKey, 1) != null;

  return (
    <SetFieldFocusContext.Provider value={focus}>
      <View
        ref={containerRef}
        style={{ flex: 1 }}
        onLayout={() =>
          // The tab bar sits below this screen; the bar must land on the keyboard, not above it.
          containerRef.current?.measureInWindow((_x, y, _w, h) =>
            setBottomGap(Math.max(0, windowHeight - (y + h))),
          )
        }
      >
        {children}
        {focusedKey != null && (
          <KeyboardStickyView
            offset={{ opened: bottomGap }}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
          >
            <View
              testID="set-keyboard-bar"
              className="flex-row items-center border-t border-zinc-200 bg-zinc-100 px-2 dark:border-zinc-700 dark:bg-zinc-800"
              style={{ height: KEYBOARD_BAR_HEIGHT }}
            >
              {(
                [
                  [-1, "chevron-up", "Previous field", hasPrev],
                  [1, "chevron-down", "Next field", hasNext],
                ] as const
              ).map(([direction, icon, label, enabled]) => (
                <Pressable
                  key={icon}
                  testID={direction === 1 ? "set-field-next" : "set-field-prev"}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ disabled: !enabled }}
                  disabled={!enabled}
                  onPress={() => move(direction)}
                  hitSlop={4}
                  className="h-11 w-11 items-center justify-center"
                >
                  <Ionicons
                    name={icon}
                    size={24}
                    color={enabled ? colors.primaryText : colors.placeholder}
                  />
                </Pressable>
              ))}
              <View className="flex-1" />
              <Pressable
                testID="set-field-done"
                accessibilityRole="button"
                onPress={() => Keyboard.dismiss()}
                hitSlop={4}
                className="h-11 justify-center px-3"
              >
                <Text className="text-base font-semibold text-blue-500">Done</Text>
              </Pressable>
            </View>
          </KeyboardStickyView>
        )}
      </View>
    </SetFieldFocusContext.Provider>
  );
}
