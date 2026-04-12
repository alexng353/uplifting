import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { Keyboard, TextInput } from "react-native";

interface InputEntry {
  ref: React.RefObject<TextInput | null>;
  order: number;
  slideIndex: number;
}

interface InputNavigationContextType {
  register: (id: string, entry: InputEntry) => void;
  unregister: (id: string) => void;
  setFocusedId: (id: string) => void;
  focusPrev: () => void;
  focusNext: () => void;
  dismiss: () => void;
}

const InputNavigationContext =
  createContext<InputNavigationContextType | null>(null);

export function InputNavigationProvider({
  activeSlide,
  children,
}: {
  activeSlide: number;
  children: React.ReactNode;
}) {
  const inputsRef = useRef(new Map<string, InputEntry>());
  const focusedIdRef = useRef<string | null>(null);
  const activeSlideRef = useRef(activeSlide);
  activeSlideRef.current = activeSlide;

  const register = useCallback((id: string, entry: InputEntry) => {
    inputsRef.current.set(id, entry);
  }, []);

  const unregister = useCallback((id: string) => {
    inputsRef.current.delete(id);
    if (focusedIdRef.current === id) {
      focusedIdRef.current = null;
    }
  }, []);

  const setFocusedId = useCallback((id: string) => {
    focusedIdRef.current = id;
  }, []);

  const getSlideInputsSorted = useCallback(() => {
    const slide = activeSlideRef.current;
    return Array.from(inputsRef.current.entries())
      .filter(([_, entry]) => entry.slideIndex === slide)
      .sort((a, b) => a[1].order - b[1].order);
  }, []);

  const focusPrev = useCallback(() => {
    const sorted = getSlideInputsSorted();
    const idx = sorted.findIndex(([id]) => id === focusedIdRef.current);
    if (idx > 0) {
      sorted[idx - 1][1].ref.current?.focus();
    }
  }, [getSlideInputsSorted]);

  const focusNext = useCallback(() => {
    const sorted = getSlideInputsSorted();
    const idx = sorted.findIndex(([id]) => id === focusedIdRef.current);
    if (idx >= 0 && idx < sorted.length - 1) {
      sorted[idx + 1][1].ref.current?.focus();
    }
  }, [getSlideInputsSorted]);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const value = useMemo(
    () => ({
      register,
      unregister,
      setFocusedId,
      focusPrev,
      focusNext,
      dismiss,
    }),
    [register, unregister, setFocusedId, focusPrev, focusNext, dismiss],
  );

  return (
    <InputNavigationContext.Provider value={value}>
      {children}
    </InputNavigationContext.Provider>
  );
}

export function useInputNavigation() {
  return useContext(InputNavigationContext);
}
