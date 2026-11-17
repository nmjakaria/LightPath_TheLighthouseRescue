// Optics data models from PRD §19. Geometry is world-space; levels remain data-only modules.
import type { RGB } from "./color";
import type { Vec2 } from "./vec2";

export interface Ray {
  origin: Vec2;
  dir: Vec2;
  color: RGB;
  intensity: number;
  bounce: number;
  skipId: string | null;
  sourceId: string;
}

export interface Segment {
  a: Vec2;
  b: Vec2;
  color: RGB;
  intensity: number;
  bounce: number;
  kind: "beam" | "prismInterior";
}

export type HitType =
  | "mirror"
  | "prism"
  | "obstacle"
  | "gate"
  | "target"
  | "switch"
  | "lamp"
  | "boundary";

export interface HitEvent {
  objectId: string;
  type: HitType;
  point: Vec2;
  normal?: Vec2;
  incident?: Vec2;
  reflected?: Vec2;
  color: RGB;
  intensity: number;
  bounce: number;
}

export interface OpticsStats {
  segmentCount: number;
  maxBounce: number;
  terminated: Record<string, number>;
  solveMs: number;
}

export interface OpticsResult {
  segments: Segment[];
  events: HitEvent[];
  stats: OpticsStats;
}

/** The subset of a level the solver needs; full LevelConfig is introduced with the level data. */
export interface LightSourceConfig {
  id: string;
  position: Vec2;
  headingDeg: number;
  color: RGB;
  intensity: number;
  housingRadius?: number;
}

export interface MirrorConfig {
  id: string;
  center: Vec2;
  angleDeg: number;
  length?: number;
}

export interface ObstacleConfig {
  id: string;
  vertices: readonly Vec2[];
}

export interface GateConfig {
  id: string;
  a: Vec2;
  b: Vec2;
  openFraction?: number;
}

export interface PrismConfig {
  id: string;
  center: Vec2;
  circumradius: number;
  orientationDeg: number;
  spreadDeg: number;
}

export interface CircleConfig {
  id: string;
  type: "target" | "switch" | "lamp";
  center: Vec2;
  radius: number;
}

export interface OpticsScene {
  sources: readonly LightSourceConfig[];
  mirrors: readonly MirrorConfig[];
  obstacles?: readonly ObstacleConfig[];
  gates?: readonly GateConfig[];
  prisms?: readonly PrismConfig[];
  circles?: readonly CircleConfig[];
}
