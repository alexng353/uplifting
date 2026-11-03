import { createContext, useContext } from "react";
import type { TextInput } from "react-native";

export const KEYBOARD_BAR_HEIGHT = 44;

export interface SetFieldFocus {
  register: (key: string, input: TextInput | null) => void;
  focused: (key: string) => void;
  blurred: (key: string) => void;
}

export const SetFieldFocusContext = createContext<SetFieldFocus | null>(null);

/** Null outside a SetFieldNavigator, where set inputs keep plain keyboard behaviour. */
export function useSetFieldFocus(): SetFieldFocus | null {
  return useContext(SetFieldFocusContext);
}
