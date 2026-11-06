import type { Muscle, MuscleColour } from "../components/muscles/renderMuscles";

/** A muscle-map region without its side prefix, e.g. "Quad" for leftQuad/rightQuad. */
export type Region =
  | "Trap"
  | "Tricep"
  | "Forearm"
  | "Calf"
  | "FrontDelt"
  | "Pec"
  | "Bicep"
  | "Serratus"
  | "Oblique"
  | "UpperAbs"
  | "MiddleAbs"
  | "LowerAbs"
  | "Adductor"
  | "Quad"
  | "Tibialis"
  | "RearDelt"
  | "Infraspinatus"
  | "Lat"
  | "LowerBack"
  | "Glute"
  | "Hamstring";

const ABS: Region[] = ["UpperAbs", "MiddleAbs", "LowerAbs"];

/**
 * The exercise database names muscles anatomically ("quadriceps, vastus lateralis").
 * Each name prefix maps to the drawn regions it covers. The map has no rhomboid or
 * neck regions, so those draw on the trapezius.
 */
const PREFIXES: [string, Region[]][] = [
  ["adductor", ["Adductor"]],
  ["gracilis", ["Adductor"]],
  ["anterior deltoid", ["FrontDelt"]],
  ["lateral deltoid", ["FrontDelt", "RearDelt"]],
  ["posterior deltoid", ["RearDelt"]],
  ["biceps brachii", ["Bicep"]],
  ["brachialis", ["Bicep"]],
  ["coracobrachialis", ["Bicep"]],
  ["brachioradialis", ["Forearm"]],
  ["extensor carpi", ["Forearm"]],
  ["flexor carpi", ["Forearm"]],
  ["erector spinae", ["LowerBack"]],
  ["external oblique", ["Oblique"]],
  ["internal oblique", ["Oblique"]],
  ["gastrocnemius", ["Calf"]],
  ["soleus", ["Calf"]],
  ["gluteus", ["Glute"]],
  ["piriformis", ["Glute"]],
  ["tensor fasciae latae", ["Glute"]],
  ["hamstrings", ["Hamstring"]],
  ["iliopsoas", ["LowerAbs"]],
  ["infraspinatus", ["Infraspinatus"]],
  ["supraspinatus", ["Infraspinatus"]],
  ["subscapularis", ["Infraspinatus"]],
  ["teres minor", ["Infraspinatus"]],
  ["teres major", ["Lat"]],
  ["latissimus dorsi", ["Lat"]],
  ["pectoralis", ["Pec"]],
  ["quadriceps", ["Quad"]],
  ["rectus abdominis", ABS],
  ["transverse abdominis", ABS],
  ["rhomboid", ["Trap"]],
  ["trapezius", ["Trap"]],
  ["levator scapulae", ["Trap"]],
  ["semispinalis", ["Trap"]],
  ["splenius", ["Trap"]],
  ["sternocleidomastoid", ["Trap"]],
  ["serratus anterior", ["Serratus"]],
  ["tibialis", ["Tibialis"]],
  ["triceps", ["Tricep"]],
];

/** Regions a muscle name covers; empty for a name the map can't draw. */
export function regionsFor(muscleName: string): Region[] {
  const name = muscleName.trim().toLowerCase();
  return PREFIXES.find(([prefix]) => name.startsWith(prefix))?.[1] ?? [];
}

export interface ExerciseLoad {
  sets: number;
  primary: readonly string[];
  secondary: readonly string[];
}

/**
 * Sets per region: each set counts fully for its primary muscles and half for its
 * secondary ones. A region counts once per exercise even when several of the
 * exercise's muscles draw on it (e.g. all four quadriceps heads).
 */
export function regionLoad(exercises: readonly ExerciseLoad[]): Map<Region, number> {
  const load = new Map<Region, number>();
  for (const e of exercises) {
    if (!(e.sets > 0)) continue;
    const weight = new Map<Region, number>();
    for (const [names, w] of [
      [e.secondary, 0.5],
      [e.primary, 1],
    ] as const) {
      for (const name of names) {
        for (const region of regionsFor(name))
          weight.set(region, Math.max(weight.get(region) ?? 0, w));
      }
    }
    for (const [region, w] of weight) load.set(region, (load.get(region) ?? 0) + e.sets * w);
  }
  return load;
}

/** Ember ramp, dim to bright. Regions with no load keep the map's default colour. */
const RAMP = ["#5C2D13", "#8A431C", "#B85B26", "#DE7536", "#F2894B"];

/** Both sides of every loaded region, coloured by its share of the busiest region. */
export function heatColours(load: Map<Region, number>): MuscleColour[] {
  const max = Math.max(0, ...load.values());
  if (max <= 0) return [];
  const colours: MuscleColour[] = [];
  for (const [region, value] of load) {
    if (!(value > 0)) continue;
    const step = Math.min(RAMP.length - 1, Math.floor((value / max) * RAMP.length));
    for (const side of ["left", "right"] as const) {
      colours.push({ muscle: `${side}${region}` as Muscle, colour: RAMP[step] });
    }
  }
  return colours;
}
