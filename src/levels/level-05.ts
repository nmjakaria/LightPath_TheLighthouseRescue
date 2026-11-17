// PRD §13 Level 5 — Lighthouse Rescue. Data only: no engine, React or DOM imports.
import { gameConfig } from "@/config/gameConfig";
import {
  GATE_THICKNESS,
  MIRROR_LENGTH,
  MOVABLE_SNAP,
  PRISM_CIRCUMRADIUS,
  ROCK_SIZE,
  SWITCH_RADIUS,
  TARGET_RADIUS,
} from "@/lib/math/constants";
import type { LevelConfig } from "@/types/level";

const ROCK_HALF_WIDTH = ROCK_SIZE.width / 2;
const ROCK_HALF_HEIGHT = ROCK_SIZE.height / 2;

export const level05: LevelConfig = {
  id: "level-05",
  index: 5,
  name: "Lighthouse Rescue",
  story: "Everything at once. Split the light, open the gate with blue, free the path for green, and light the red boat.",
  difficulty: "hard",
  par: { timeSec: 210, moves: 10 },
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
  movableObstacles: [
    {
      id: "R1",
      localVertices: [
        { x: -ROCK_HALF_WIDTH, y: -ROCK_HALF_HEIGHT },
        { x: ROCK_HALF_WIDTH, y: -ROCK_HALF_HEIGHT },
        { x: ROCK_HALF_WIDTH, y: ROCK_HALF_HEIGHT },
        { x: -ROCK_HALF_WIDTH, y: ROCK_HALF_HEIGHT },
      ],
      start: { x: 720, y: 540 },
      axis: "x",
      range: [560, 1000],
      snap: MOVABLE_SNAP,
    },
  ],
  switches: [
    { id: "SW1", center: { x: 745, y: 620 }, radius: SWITCH_RADIUS, requires: "blue", gateId: "G1" },
  ],
  gates: [
    { id: "G1", a: { x: 910, y: 310 }, b: { x: 910, y: 410 }, thickness: GATE_THICKNESS },
  ],
  targets: [
    { id: "T_R", center: { x: 745, y: 100 }, radius: TARGET_RADIUS, requires: "red", required: true },
    { id: "T_G", center: { x: 1140, y: 360 }, radius: TARGET_RADIUS, requires: "green", required: true },
  ],
  celebrationSec: gameConfig.completion.finaleSec,
  tutorials: [
    { id: "L5-blue", text: "Blue light can power switches, not just boats.", trigger: "start" },
    { id: "L5-rock", text: "Slide the rock out of the blue beam's way.", trigger: "firstPrismHit" },
    { id: "L5-gate", text: "The green beam can pass once blue holds SW1.", trigger: "gateSeen" },
  ],
  hints: [
    { text: "Rebuild the prism path, then clear the blue beam with the rock." },
    { text: "SW1 opens G1 only while blue light touches it." },
    { text: "M1/M2/M3 = 135°, M4 = 45°, then drag R1 to x = 680." },
  ],
  solution: [
    { componentId: "M1", angleDeg: 135 },
    { componentId: "M2", angleDeg: 135 },
    { componentId: "M3", angleDeg: 135 },
    { componentId: "M4", angleDeg: 45 },
    { componentId: "R1", position: { x: 680, y: 540 } },
  ],
};
