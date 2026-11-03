import { useCallback, useState } from "react";
import type { SideMode } from "../lib/set-rows";
import { getSideDefault, setSideDefault } from "../services/storage";

/** The exercise's default mode for new sets, remembered on this device per exercise. */
export function useSideDefault(
  exerciseId: string,
  fallback: SideMode,
): [SideMode, (mode: SideMode) => void] {
  const [mode, setMode] = useState<SideMode>(() => getSideDefault(exerciseId) ?? fallback);
  const choose = useCallback(
    (next: SideMode) => {
      setSideDefault(exerciseId, next);
      setMode(next);
    },
    [exerciseId],
  );
  return [mode, choose];
}
