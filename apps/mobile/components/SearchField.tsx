import { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useThemeColors } from "../hooks/useThemeColors";
import { inlineInput } from "../lib/input-style";

/**
 * The app's search box (Add Exercise, Stats → Exercises): Ember border and caret while
 * focused, clear button once there's text.
 */
export default function SearchField({
  value,
  onChangeText,
  placeholder,
  testID = "search",
  boxTestID,
  className = "mx-4 mb-2",
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID?: string;
  boxTestID?: string;
  className?: string;
}) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <View
      testID={boxTestID}
      className={`${className} flex-row items-center rounded-lg border bg-zinc-50 dark:bg-zinc-800 px-3 ${
        focused ? "border-ember-500 dark:border-ember-400" : "border-zinc-300 dark:border-zinc-600"
      }`}
    >
      <Ionicons name="search" size={18} color={focused ? colors.caret : colors.mutedIcon} />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.caret}
        cursorColor={colors.caret}
        className="ml-2 flex-1 dark:text-zinc-100"
        style={[inlineInput, { height: 40 }]}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          testID={`${testID}-clear`}
          accessibilityLabel="Clear search"
          onPress={() => onChangeText("")}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={colors.mutedIcon} />
        </Pressable>
      )}
    </View>
  );
}
