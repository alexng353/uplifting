import {
  frontMuscles,
  backMuscles,
  frontNeutral,
  frontNeutralHalf,
  backNeutral,
  backNeutralHalf,
} from "./geometry";

export type MuscleView = "front" | "back";
type Region = keyof typeof frontMuscles | keyof typeof backMuscles;
/** Left and right always refer to the subject, never the viewer. */
export type Muscle = `${"left" | "right"}${Region}`;
export interface MuscleColour {
  muscle: Muscle;
  colour: string;
}
export interface MuscleRenderOptions {
  view?: MuscleView;
  defaultColour?: string;
  outlineColour?: string;
  neutralColour?: string;
}

export const muscleIds: readonly Muscle[] = [
  ...new Set([...Object.keys(frontMuscles), ...Object.keys(backMuscles)]),
].flatMap((region) => [`left${region}`, `right${region}`] as Muscle[]);

function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );
}

const paths = (regions: readonly string[]) =>
  regions.map((d) => `<path d="${d}"${d.endsWith("Z") ? "" : ' fill="none"'}/>`).join("");

/** Returns a standalone SVG. Each muscle is a <g id="leftPec">, including
 * its internal segments. Inputs are fresh per render; the last duplicate wins.
 * Muscles not visible in the selected view are ignored.
 */
export function renderMuscles(
  muscles: readonly MuscleColour[],
  {
    view = "front",
    defaultColour = "#292d2e",
    outlineColour = "#171a1b",
    neutralColour = "#292d2e",
  }: MuscleRenderOptions = {},
): string {
  const front = view === "front";
  const geometry = front ? frontMuscles : backMuscles;
  const centre = front ? 327 : 617;
  const colours = new Map(muscles.map(({ muscle, colour }) => [muscle, colour]));
  const reflection = `translate(${centre * 2} 0) scale(-1 1)`;
  const neutralHalf = paths(front ? frontNeutralHalf : backNeutralHalf);
  const neutral = `<g fill="${escapeXml(neutralColour)}">${paths(front ? frontNeutral : backNeutral)}${neutralHalf}<g transform="${reflection}">${neutralHalf}</g></g>`;
  const regions = Object.entries(geometry)
    .flatMap(([region, shapes]) =>
      ["left", "right"].map((side) => {
        const id = `${side}${region}` as Muscle;
        const reflected = front ? side === "left" : side === "right";
        return `<g id="${id}" fill="${escapeXml(colours.get(id) ?? defaultColour)}"${reflected ? ` transform="${reflection}"` : ""}>${paths(shapes)}</g>`;
      }),
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="115 700 425 835" fill="none" role="img" aria-label="${view} muscle map"><g stroke="${escapeXml(outlineColour)}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${front ? "" : ' transform="translate(-290 0)"'}>${neutral}${regions}</g></svg>`;
}
