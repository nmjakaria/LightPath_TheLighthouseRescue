import { MIRROR_LENGTH, SWITCH_RADIUS, TARGET_RADIUS } from "@/lib/math/constants";
import type { RGB } from "@/types/color";
import type { LevelConfig, LevelMirrorConfig, LevelSourceConfig } from "@/types/level";

export const WHITE: RGB = { r: 1, g: 1, b: 1 };
export const RED: RGB = { r: 1, g: 0, b: 0 };
export const GREEN: RGB = { r: 0, g: 1, b: 0 };

export function testLevel(partial: Partial<LevelConfig> = {}): LevelConfig {
  return {
    id: "test-level",
    index: 99,
    name: "Test Scene",
    story: "Mechanics test scene",
    difficulty: "easy",
    par: { timeSec: 60, moves: 5 },
    sources: [],
    mirrors: [],
    prisms: [],
    obstacles: [],
    movableObstacles: [],
    switches: [],
    gates: [],
    targets: [],
    tutorials: [],
    hints: [],
    solution: [],
    ...partial,
  };
}

export function lamp(
  id: string,
  x: number,
  y: number,
  headingDeg = 0,
  color: RGB = WHITE,
  rotatable = false,
): LevelSourceConfig {
  return { id, position: { x, y }, headingDeg, color, intensity: 1, rotatable };
}

export function mirrorAt(id: string, x: number, y: number, angleDeg: number): LevelMirrorConfig {
  return { id, center: { x, y }, angleDeg, length: MIRROR_LENGTH, rotatable: true };
}

export function targetAt(id: string, x: number, y: number, requires: "any" | "red" | "green" | "blue" = "any") {
  return { id, center: { x, y }, radius: TARGET_RADIUS, requires, required: false };
}

export function switchAt(id: string, x: number, y: number, gateId: string) {
  return { id, center: { x, y }, radius: SWITCH_RADIUS, requires: "any" as const, gateId };
}
