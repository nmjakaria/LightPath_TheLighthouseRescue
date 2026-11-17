// PRD §13 Level 1 — First Light. Data only: no engine, React or DOM imports.
import { MIRROR_LENGTH, TARGET_RADIUS } from "@/lib/math/constants";
import type { LevelConfig } from "@/types/level";

export const level01: LevelConfig = {
  id: "level-01",
  index: 1,
  name: "First Light",
  story: "The lamp still works. Aim it at the first boat using two mirrors.",
  difficulty: "tutorial",
  par: { timeSec: 45, moves: 3 },
  sources: [
    {
      id: "S1",
      position: { x: 120, y: 560 },
      headingDeg: 0,
      color: { r: 1, g: 1, b: 1 },
      intensity: 1,
      rotatable: false,
    },
  ],
  mirrors: [
    {
      id: "M1",
      center: { x: 500, y: 560 },
      angleDeg: 90,
      length: MIRROR_LENGTH,
      rotatable: true,
    },
    {
      id: "M2",
      center: { x: 500, y: 260 },
      angleDeg: 0,
      length: MIRROR_LENGTH,
      rotatable: true,
    },
  ],
  prisms: [],
  obstacles: [],
  movableObstacles: [],
  switches: [],
  gates: [],
  targets: [
    {
      id: "T1",
      center: { x: 1000, y: 260 },
      radius: TARGET_RADIUS,
      requires: "any",
      required: true,
    },
  ],
  tutorials: [
    { id: "L1-rotate", text: "Drag the ring to rotate a mirror.", trigger: "start" },
    {
      id: "L1-reflect",
      text: "Light leaves a mirror at the same angle it arrived.",
      trigger: "firstRotate",
    },
  ],
  hints: [
    { text: "Select the mirror at the end of the beam." },
    { text: "A '/' mirror turns east light upward." },
    { text: "Set M1 and M2 to 135°." },
  ],
  solution: [
    { componentId: "M1", angleDeg: 135 },
    { componentId: "M2", angleDeg: 135 },
  ],
};
