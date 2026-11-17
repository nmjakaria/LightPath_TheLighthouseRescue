import { describe, expect, it } from "vitest";
import { beamColor } from "@/engine/render/layers/BeamLayer";
import type { Palette } from "@/engine/render/palette";

const palette = {
  abyss: "#040813",
  midnight: "#0a1530",
  deepNavy: "#11224a",
  navyLine: "#26417a",
  cyanBeam: "#22d3ee",
  oceanTeal: "#14b8a6",
  beamCore: "#e6fbff",
  softWhite: "#f1f7ff",
  mist: "#9fb3d1",
  starGold: "#ffd166",
  lightRed: "#ff4d6d",
  lightGreen: "#4dff9f",
  lightBlue: "#4d9bff",
  success: "#34d399",
} satisfies Palette;

describe("beam colour mapping", () => {
  it("uses the palette token for a pure channel", () => {
    expect(beamColor({ r: 1, g: 0, b: 0 }, palette)).toBe(palette.lightRed);
    expect(beamColor({ r: 0, g: 1, b: 0 }, palette)).toBe(palette.lightGreen);
    expect(beamColor({ r: 0, g: 0, b: 1 }, palette)).toBe(palette.lightBlue);
  });

  it("uses cyan for white and mixed beams", () => {
    expect(beamColor({ r: 1, g: 1, b: 1 }, palette)).toBe(palette.cyanBeam);
    expect(beamColor({ r: 0.5, g: 0.5, b: 0 }, palette)).toBe(palette.cyanBeam);
  });
});
