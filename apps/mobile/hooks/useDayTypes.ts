import { useCallback, useState } from "react";

import { seedDayTypes, type DayType } from "../lib/day-types";
import { getDayTypes, getExercises, getExerciseSequences, setDayTypes } from "../services/storage";

/** Saved day types, or Upper and Lower seeded from history the first time. */
export function loadDayTypes(): DayType[] {
  const saved = getDayTypes();
  if (saved) return saved;
  const names = new Map(getExercises().map((e) => [e.id, e.name]));
  const seeded = seedDayTypes(getExerciseSequences(), 4, (id) => names.get(id));
  setDayTypes(seeded);
  return seeded;
}

export function useDayTypes(): { days: DayType[]; save: (days: DayType[]) => void } {
  const [days, setDays] = useState<DayType[]>(loadDayTypes);
  const save = useCallback((next: DayType[]) => {
    setDayTypes(next);
    setDays(next);
  }, []);
  return { days, save };
}
