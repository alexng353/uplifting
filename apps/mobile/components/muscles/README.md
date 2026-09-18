# Muscle map

Hand-traced front/back vector artwork based on the supplied screenshot. This is an
approximation of the raster reference, not the original vector source or a medical
anatomy diagram. Head, hands, knees, and feet are neutral regions.

## React Native

```tsx
import { MuscleMap } from "@/components/muscles";

<MuscleMap
  muscles={[
    { muscle: "leftPec", colour: "#22c55e" },
    { muscle: "rightQuad", colour: "#60a5fa" },
  ]}
  view="front"
  defaultColour="#f0d900"
  width={212.5}
  height={417.5}
/>;
```

Uses the existing `react-native-svg` dependency. Dimensions default to the values
above; the viewBox scales proportionally. No additional dependencies or WebView.

## Standalone SVG

```ts
import { renderMuscles, type MuscleColour } from "./renderMuscles";

const colours: MuscleColour[] = [{ muscle: "leftPec", colour: "green" }];
const svg = renderMuscles(colours, { view: "front" });
```

`renderMuscles` returns an SVG **string**. Each region is a group such as
`<g id="leftPec" fill="green">`; its child paths inherit the colour. Set a group's
`fill` attribute to recolour an existing inline SVG, or render again from state.
Use selectors scoped to a particular SVG when displaying multiple maps.

Left/right are **anatomical**: `leftPec` is on the viewer's right in front view;
`leftLat` is on the viewer's left in back view. Each render starts fresh. The last
entry for a repeated muscle wins. Regions absent from the selected view are
ignored, allowing the same colour list to drive both views.

Options: `view` (`front` by default), `defaultColour` (`#292d2e`), `neutralColour`
(`#292d2e`), and `outlineColour` (`#171a1b`). Colours are SVG paint values, such as
CSS colour names or hex codes. The SVG has a transparent background.

Every region below has a `left` and `right` prefix (for example, `leftUpperAbs`).
`muscleIds` exports the complete typed list. These are visual region IDs, independent
of the API's exercise muscle categories; no training-volume mapping is assumed.

| Surface | Regions                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------- |
| Both    | Trap, Tricep, Forearm, Calf                                                                       |
| Front   | FrontDelt, Pec, Bicep, Serratus, Oblique, UpperAbs, MiddleAbs, LowerAbs, Adductor, Quad, Tibialis |
| Back    | RearDelt, Infraspinatus, Lat, LowerBack, Glute, Hamstring                                         |

## Artwork and preview

Edit `geometry.ts`, then regenerate checked-in assets from the repository root:

```sh
bun scripts/generate-muscle-assets.ts
bun test apps/mobile/components/muscles/renderMuscles.test.ts
```

Outputs in `apps/mobile/assets/muscles/`:

- `front.svg` and `back.svg`: standalone addressable artwork.
- `preview.html`: open locally to select/recolour muscles and download either SVG.

The artwork is deliberately a reusable component; it is not wired into the Stats
screen or assigned training scores.
