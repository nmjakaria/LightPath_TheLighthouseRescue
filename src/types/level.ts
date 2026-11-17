// Full level data model from PRD §19. Levels are data only; runtime state lives in the engine.
import type { RGB } from "./color";
import type { Vec2 } from "./vec2";

export type TargetColor = "any" | "red" | "green" | "blue";
export type LevelDifficulty = "tutorial" | "easy" | "medium" | "hard";
export type TutorialTrigger = "start" | "firstRotate" | "firstPrismHit" | "gateSeen";

export interface LevelSourceConfig {
  id: string;
  position: Vec2;
  headingDeg: number;
  color: RGB;
  intensity: number;
  rotatable: boolean;
  housingRadius?: number;
}

export interface LevelMirrorConfig {
  id: string;
  center: Vec2;
  angleDeg: number;
  length: number;
  rotatable: boolean;
}

export interface LevelPrismConfig {
  id: string;
  center: Vec2;
  circumradius: number;
  orientationDeg: number;
  spreadDeg: number;
}

export interface LevelObstacleConfig {
  id: string;
  vertices: readonly Vec2[];
}

export interface LevelMovableObstacleConfig {
  id: string;
  localVertices: readonly Vec2[];
  start: Vec2;
  axis: "x" | "y";
  range: readonly [number, number];
  snap: number;
}

export interface LevelSwitchConfig {
  id: string;
  center: Vec2;
  radius: number;
  requires: TargetColor;
  gateId: string;
}

export interface LevelGateConfig {
  id: string;
  a: Vec2;
  b: Vec2;
  thickness: number;
}

export interface LevelTargetConfig {
  id: string;
  center: Vec2;
  radius: number;
  requires: TargetColor;
  required: boolean;
}

export interface LevelTutorial {
  id: string;
  text: string;
  trigger: TutorialTrigger;
}

export interface LevelSolutionStep {
  componentId: string;
  angleDeg?: number;
  position?: Vec2;
}

export interface LevelConfig {
  id: string;
  index: number;
  name: string;
  story: string;
  difficulty: LevelDifficulty;
  par: { timeSec: number; moves: number };
  rotationStepDeg?: number;
  darkness?: boolean;
  /** Extra celebration time before the result screen; Level 5 uses the configured finale duration. */
  celebrationSec?: number;
  sources: readonly LevelSourceConfig[];
  mirrors: readonly LevelMirrorConfig[];
  prisms: readonly LevelPrismConfig[];
  obstacles: readonly LevelObstacleConfig[];
  movableObstacles: readonly LevelMovableObstacleConfig[];
  switches: readonly LevelSwitchConfig[];
  gates: readonly LevelGateConfig[];
  targets: readonly LevelTargetConfig[];
  tutorials: readonly LevelTutorial[];
  hints: readonly { text: string }[];
  solution: readonly LevelSolutionStep[];
}

/* Runtime copies stay mutable inside the engine so level modules remain frozen data. Sources keep
 * their rotatable heading, gates animate an open fraction, and movable obstacles hold a position. */
export type SourceRuntime = LevelSourceConfig;
export type TargetRuntime = LevelTargetConfig & { chargeSec: number; active: boolean };
export type SwitchRuntime = LevelSwitchConfig & { active: boolean };
export type GateRuntime = LevelGateConfig & { openFraction: number };
export type MovableObstacleRuntime = LevelMovableObstacleConfig & { position: Vec2 };
