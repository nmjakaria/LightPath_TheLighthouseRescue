// PRD §13 Level 2 — The Broken Path. Data only: no engine, React or DOM imports.
import { MIRROR_LENGTH, TARGET_RADIUS } from "@/lib/math/constants";
import type { LevelConfig } from "@/types/level";

export const level02: LevelConfig = {
  id: "level-02",
  index: 2,
  name: "The Broken Path",
  story: "A collapsed wall blocks the straight route. Go around it.",
  difficulty: "easy",
  par: { timeSec: 90, moves: 5 },
  sources: [
    {
      id: "S1",
      position: { x: 100, y: 360 },
      headingDeg: 0,
      color: { r: 1, g: 1, b: 1 },
      intensity: 1,
      rotatable: false,
    },
  ],
  mirrors: [
    { id: "M1", center: { x: 300, y: 360 }, angleDeg: 90, length: MIRROR_LENGTH, rotatable: true },
    { id: "M2", center: { x: 300, y: 140 }, angleDeg: 135, length: MIRROR_LENGTH, rotatable: false },
    { id: "M3", center: { x: 900, y: 140 }, angleDeg: 0, length: MIRROR_LENGTH, rotatable: true },
    { id: "M4", center: { x: 900, y: 360 }, angleDeg: 90, length: MIRROR_LENGTH, rotatable: true },
  ],
  prisms: [],
  obstacles: [
    {
      id: "W1",
      vertices: [
        { x: 600, y: 240 },
        { x: 660, y: 240 },
        { x: 660, y: 480 },
        { x: 600, y: 480 },
      ],
    },
  ],
  movableObstacles: [],
  switches: [],
  gates: [],
  targets: [
    { id: "T1", center: { x: 1140, y: 360 }, radius: TARGET_RADIUS, requires: "any", required: true },
  ],
  tutorials: [
    { id: "L2-wall", text: "A wall blocks the straight route. Light ends where it hits.", trigger: "start" },
    { id: "L2-locked", text: "The padlocked mirror is already aligned: build the path around it.", trigger: "firstRotate" },
  ],
  hints: [
    { text: "Use M1 to turn the beam north before the wall." },
    { text: "M2 is fixed; send the beam east along the top corridor." },
    { text: "Set M1 to 135°, M3 to 45° and M4 to 45°." },
  ],
  solution: [
    { componentId: "M1", angleDeg: 135 },
    { componentId: "M3", angleDeg: 45 },
    { componentId: "M4", angleDeg: 45 },
  ],
};
