import { describe, expect, test } from "bun:test";
import { renderMuscles } from "./renderMuscles";

describe("renderMuscles", () => {
  test("colours anatomical left independently and resets on the next render", () => {
    const svg = renderMuscles([{ muscle: "leftPec", colour: "green" }]);
    expect(svg).toContain('id="leftPec" fill="green"');
    expect(svg).toContain('id="rightPec" fill="#292d2e"');
    expect(renderMuscles([])).toContain('id="leftPec" fill="#292d2e"');
  });
  test("renders the requested surface and lets the last colour win", () => {
    const svg = renderMuscles(
      [
        { muscle: "leftLat", colour: "red" },
        { muscle: "leftLat", colour: "#22c55e" },
      ],
      { view: "back", defaultColour: "#facc15" },
    );
    expect(svg).toContain('id="leftLat" fill="#22c55e"');
    expect(svg).toContain('id="rightLat" fill="#facc15"');
    expect(svg).not.toContain('id="leftPec"');
  });
  test("escapes values placed in XML attributes", () => {
    const svg = renderMuscles([{ muscle: "leftPec", colour: '"/><script>alert(1)</script>' }]);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&quot;/&gt;&lt;script&gt;");
  });
});

test("anatomical left is mirrored only in front view", () => {
  const front = renderMuscles([]);
  const back = renderMuscles([], { view: "back" });
  expect(front).toContain('id="leftPec" fill="#292d2e" transform="translate(654 0) scale(-1 1)"');
  expect(front).toContain('id="rightPec" fill="#292d2e"><path');
  expect(back).toContain('id="leftLat" fill="#292d2e"><path');
  expect(back).toContain('id="rightLat" fill="#292d2e" transform="translate(1234 0) scale(-1 1)"');
});
