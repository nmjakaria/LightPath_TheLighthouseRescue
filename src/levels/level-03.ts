// PRD §13 Level 3 — Color of Hope. Data only: no engine, React or DOM imports.
import { MIRROR_LENGTH, PRISM_CIRCUMRADIUS, TARGET_RADIUS } from "@/lib/math/constants";
import type { LevelConfig } from "@/types/level";

export const level03: LevelConfig = {
  id: "level-03",
  index: 3,
  name: "Color of Hope",
  story: "The salvaged prism splits the beam. Light each boat with its own color.",
  difficulty: "medium",
  par: { timeSec: 120, moves: 7 },
  sources: [
    {
      id: "S1",
      position: { x: 100, y: 620 },
      headingDeg: 0,
      color: { r: 1, g: 1, b: 1 },
      intensity: 1,
      rotatable: false,
    },
  ],
  mirrors: [
    { id: "M1", center: { x: 220, y: 620 }, angleDeg: 90, length: MIRROR_LENGTH, rotatable: true },
    { id: "M2", center: { x: 220, y: 360 }, angleDeg: 0, length: MIRROR_LENGTH, rotatable: true },
    { id: "M3", center: { x: 700, y: 311 }, angleDeg: 0, length: MIRROR_LENGTH, rotatable: true },
    { id: "M4", center: { x: 700, y: 408 }, angleDeg: 90, length: MIRROR_LENGTH, rotatable: true },
  ],
  prisms: [
    { id: "P1", center: { x: 440, y: 360 }, circumradius: PRISM_CIRCUMRADIUS, orientationDeg: 30, spreadDeg: 12 },
  ],
  obstacles: [],
  movableObstacles: [],
  switches: [],
  gates: [],
  targets: [
    { id: "T_R", center: { x: 745, y: 100 }, radius: TARGET_RADIUS, requires: "red", required: true },
    { id: "T_G", center: { x: 1140, y: 360 }, radius: TARGET_RADIUS, requires: "green", required: true },
    { id: "T_B", center: { x: 745, y: 620 }, radius: TARGET_RADIUS, requires: "blue", required: true },
  ],
  tutorials: [
    {
      id: "L3-prism",
      text: "White light is a mix of colors. The prism pulls it apart (simplified model).",
      trigger: "start",
    },
    {
      id: "L3-colors",
      text: "Each boat only answers to its own color.",
      trigger: "firstPrismHit",
    },
  ],
  hints: [
    { text: "Rotate M1 and M2 to bring the beam into P1." },
    { text: "M3 catches red; M4 catches blue. Green flies straight through." },
    { text: "Set M1, M2 and M3 to 135°, and M4 to 45°." },
  ],
  solution: [
    { componentId: "M1", angleDeg: 135 },
    { componentId: "M2", angleDeg: 135 },
    { componentId: "M3", angleDeg: 135 },
    { componentId: "M4", angleDeg: 45 },
  ],
};
