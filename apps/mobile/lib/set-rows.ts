import type { StoredSet } from "../services/storage";

/**
 * A set row is what the user sees as one numbered set. The mode is per row, so one
 * exercise can mix them (e.g. two bilateral sets, then a unilateral one):
 * - bilateral: one set with no side;
 * - unilateral: one reps/weight row meaning both sides did the same; stored as equal L
 *   and R sets (`layout: "combined"`) so volume and per-side history stay right;
 * - split: an L and an R set shown as two rows (no layout; how older data is stored).
 * The stored sets stay a flat list, so sync, volume and the gate feed are unchanged.
 */
export type SideMode = "bilateral" | "unilateral" | "split";

export type SetRow =
  | { kind: "bilateral"; set: StoredSet }
  | { kind: "sided"; layout: "combined" | "split"; right?: StoredSet; left?: StoredSet };

export const NEXT_MODE: Record<SideMode, SideMode> = {
  bilateral: "unilateral",
  unilateral: "split",
  split: "bilateral",
};

export const MODE_LABEL: Record<SideMode, string> = {
  bilateral: "Bilateral",
  unilateral: "Unilateral",
  split: "Split",
};

export function rowMode(row: SetRow): SideMode {
  if (row.kind === "bilateral") return "bilateral";
  return row.layout === "combined" ? "unilateral" : "split";
}

export function rowSets(row: SetRow): StoredSet[] {
  if (row.kind === "bilateral") return [row.set];
  return [row.right, row.left].filter((s): s is StoredSet => s != null);
}

/**
 * Rows from the stored order. Sided sets pair up within each unbroken run of sided
 * sets (k-th R with k-th L), which also reads server data and older R..R L..L lists.
 */
export function toRows(sets: StoredSet[]): SetRow[] {
  const rows: SetRow[] = [];
  let i = 0;
  while (i < sets.length) {
    if (sets[i].side == null) {
      rows.push({ kind: "bilateral", set: sets[i] });
      i++;
      continue;
    }
    let j = i;
    while (j < sets.length && sets[j].side != null) j++;
    const run = sets.slice(i, j);
    const right = run.filter((s) => s.side === "R");
    const left = run.filter((s) => s.side === "L");
    for (let k = 0; k < Math.max(right.length, left.length); k++) {
      const layout = (right[k] ?? left[k])?.layout === "combined" ? "combined" : "split";
      rows.push({ kind: "sided", layout, right: right[k], left: left[k] });
    }
    i = j;
  }
  return rows;
}

export function fromRows(rows: SetRow[]): StoredSet[] {
  return rows.flatMap((row) => {
    if (row.kind === "bilateral") {
      const { side: _side, layout: _layout, ...set } = row.set;
      return [set];
    }
    const layout = row.layout === "combined" ? { layout: "combined" as const } : {};
    const strip = ({ layout: _layout, ...set }: StoredSet) => set;
    return [
      ...(row.right ? [{ ...strip(row.right), side: "R" as const, ...layout }] : []),
      ...(row.left ? [{ ...strip(row.left), side: "L" as const, ...layout }] : []),
    ];
  });
}

/** The same row in another mode, keeping every value that still has a place. */
export function convertRow(row: SetRow, mode: SideMode, newId: () => string): SetRow {
  if (mode === "bilateral") {
    if (row.kind === "bilateral") return row;
    const base = (row.right ?? row.left)!;
    const { side: _side, layout: _layout, ...set } = base;
    return {
      kind: "bilateral",
      set: {
        ...set,
        reps: row.right?.reps ?? row.left?.reps,
        weight: row.right?.weight ?? row.left?.weight,
      },
    };
  }
  const layout = mode === "unilateral" ? "combined" : "split";
  if (row.kind === "sided") {
    if (mode !== "unilateral" || !row.right || !row.left) return { ...row, layout };
    // Unilateral means L = R; keep the R values for both.
    return {
      ...row,
      layout,
      left: { ...row.left, reps: row.right.reps, weight: row.right.weight },
    };
  }
  const { side: _side, layout: _layout, ...set } = row.set;
  return {
    kind: "sided",
    layout,
    right: { ...set, side: "R" },
    left: { ...set, id: newId(), side: "L" },
  };
}

export function isRowEmpty(row: SetRow): boolean {
  return rowSets(row).every((s) => s.reps == null && s.weight == null);
}

/** Row index holding a set, or -1. */
export function rowIndexOf(rows: SetRow[], setId: string): number {
  return rows.findIndex((row) => rowSets(row).some((s) => s.id === setId));
}
