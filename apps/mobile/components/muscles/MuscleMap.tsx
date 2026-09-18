import { SvgXml } from "react-native-svg";
import { renderMuscles, type MuscleColour, type MuscleRenderOptions } from "./renderMuscles";

export interface MuscleMapProps extends MuscleRenderOptions {
  muscles?: readonly MuscleColour[];
  width?: number | string;
  height?: number | string;
}

/** Native SVG rendering; no WebView or bitmap assets. */
export function MuscleMap({
  muscles = [],
  width = 212.5,
  height = 417.5,
  ...options
}: MuscleMapProps) {
  return (
    <SvgXml
      xml={renderMuscles(muscles, options)}
      width={width}
      height={height}
      accessibilityLabel={`${options.view ?? "front"} muscle map`}
    />
  );
}
