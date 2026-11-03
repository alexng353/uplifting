import type { TextStyle } from "react-native";

/**
 * Single-line TextInput box. iOS clips descenders (g, y) when a single-line input has
 * a lineHeight (NativeWind's text-base sets one) or vertical padding inside a fixed
 * height, so use an explicit height, no vertical padding and no lineHeight.
 */
export const singleLineInput: TextStyle = {
  height: 48,
  fontSize: 16,
  paddingVertical: 0,
  textAlignVertical: "center",
};

/** The same for the larger one-time-code fields. */
export const singleLineInputLarge: TextStyle = {
  height: 56,
  fontSize: 20,
  paddingVertical: 0,
  textAlignVertical: "center",
};

/** An unboxed input inside a row (search bars, settings rows): no lineHeight to clip. */
export const inlineInput: TextStyle = {
  fontSize: 16,
  paddingVertical: 0,
  minHeight: 36,
  textAlignVertical: "center",
};
