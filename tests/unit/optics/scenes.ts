import type {
  CircleConfig,
  LightSourceConfig,
  MirrorConfig,
  OpticsScene,
} from "@/types/optics";

export const WHITE = { r: 1, g: 1, b: 1 };

export function source(
  id: string,
  position: { x: number; y: number },
  headingDeg = 0,
  intensity = 1,
  housingRadius = 0,
): LightSourceConfig {
  return { id, position, headingDeg, color: WHITE, intensity, housingRadius };
}

export function mirror(
  id: string,
  center: { x: number; y: number },
  angleDeg = 90,
  length = 96,
): MirrorConfig {
  return { id, center, angleDeg, length };
}

export function circle(
  id: string,
  type: CircleConfig["type"],
  center: { x: number; y: number },
  radius = 20,
): CircleConfig {
  return { id, type, center, radius };
}

export function scene(partial: Partial<OpticsScene>): OpticsScene {
  return { sources: [], mirrors: [], ...partial };
}

/** Four 135° mirrors in a zigzag: east → north → east → north → east into the target. */
export function fourMirrorScene(): OpticsScene {
  return scene({
    sources: [source("S1", { x: 120, y: 600 })],
    mirrors: [
      mirror("M1", { x: 400, y: 600 }, 135),
      mirror("M2", { x: 400, y: 300 }, 135),
      mirror("M3", { x: 800, y: 300 }, 135),
      mirror("M4", { x: 800, y: 150 }, 135),
    ],
    circles: [circle("T1", "target", { x: 1000, y: 150 }, 28)],
  });
}

export function facingMirrorScene(): OpticsScene {
  return scene({
    sources: [source("S1", { x: 500, y: 360 })],
    mirrors: [
      mirror("A", { x: 400, y: 360 }, 90, 600),
      mirror("B", { x: 600, y: 360 }, 90, 600),
    ],
  });
}
