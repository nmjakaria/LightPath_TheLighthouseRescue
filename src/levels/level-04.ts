// PRD §13 Level 4 — The Dark Passage. Data only: no engine, React or DOM imports.
import { GATE_THICKNESS, MIRROR_LENGTH, SWITCH_RADIUS, TARGET_RADIUS } from "@/lib/math/constants";
import type { LevelConfig } from "@/types/level";

export const level04: LevelConfig = {
  id: "level-04",
  index: 4,
  name: "The Dark Passage",
  story: "A jammed gate blocks the corridor in the dark. Power the switch with one lamp to open the way for the other.",
  difficulty: "medium",
  par: { timeSec: 150, moves: 9 },
  sources: [
    {
      id: "S1",
      position: { x: 100, y: 620 },
      headingDeg: 0,
      color: { r: 1, g: 1, b: 1 },
      intensity: 1,
      rotatable: false,
    },
    {
      id: "S2",
      position: { x: 100, y: 200 },
      headingDeg: -30,
      color: { r: 1, g: 1, b: 1 },
      intensity: 1,
      rotatable: true,
    },
  ],
  mirrors: [
    { id: "M1", center: { x: 300, y: 620 }, angleDeg: 90, length: MIRROR_LENGTH, rotatable: true },
    { id: "M2", center: { x: 300, y: 480 }, angleDeg: 0, length: MIRROR_LENGTH, rotatable: true },
    { id: "M3", center: { x: 780, y: 480 }, angleDeg: 0, length: MIRROR_LENGTH, rotatable: true },
    { id: "M4", center: { x: 780, y: 620 }, angleDeg: 90, length: MIRROR_LENGTH, rotatable: true },
    { id: "M5", center: { x: 1000, y: 200 }, angleDeg: 90, length: MIRROR_LENGTH, rotatable: true },
  ],
  prisms: [],
  obstacles: [
    {
      id: "B1",
      vertices: [
        { x: 420, y: 540 },
        { x: 460, y: 540 },
        { x: 460, y: 700 },
        { x: 420, y: 700 },
      ],
    },
  ],
  movableObstacles: [],
  switches: [
    { id: "SW1", center: { x: 1000, y: 620 }, radius: SWITCH_RADIUS, requires: "any", gateId: "G1" },
  ],
  gates: [
    { id: "G1", a: { x: 650, y: 140 }, b: { x: 650, y: 260 }, thickness: GATE_THICKNESS },
  ],
  targets: [
    { id: "T1", center: { x: 1000, y: 420 }, radius: TARGET_RADIUS, requires: "any", required: true },
  ],
  darkness: true,
  tutorials: [
    { id: "L4-lamp", text: "This lamp can be turned too.", trigger: "start" },
    { id: "L4-gate", text: "Some doors answer to light.", trigger: "gateSeen" },
  ],
  hints: [
    { text: "The lower lamp powers SW1; the upper lamp needs the gate open." },
    { text: "Aim S2 east, then use M5 to send it down to T1." },
    { text: "S2 = 0°; M1/M2 = 135°; M3/M4/M5 = 45°." },
  ],
  solution: [
    { componentId: "S2", angleDeg: 0 },
    { componentId: "M1", angleDeg: 135 },
    { componentId: "M2", angleDeg: 135 },
    { componentId: "M3", angleDeg: 45 },
    { componentId: "M4", angleDeg: 45 },
    { componentId: "M5", angleDeg: 45 },
  ],
};
