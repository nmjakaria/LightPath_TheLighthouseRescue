// Presentation toggles and the solver-derived values printed by the Optics Inspector.
import type { HitType } from "./optics";
import type { Vec2 } from "./vec2";

export interface PresentationState {
  inspector: boolean;
  normalsOnly: boolean;
  glow: boolean;
  particles: boolean;
}

/** A copy of one solver HitEvent with the derived quantities the Inspector displays. */
export interface InspectorHit {
  objectId: string;
  type: HitType;
  point: Vec2;
  incident: Vec2 | null;
  normal: Vec2 | null;
  reflected: Vec2 | null;
  dot: number | null;
  incidenceDeg: number | null;
  reflectionDeg: number | null;
  bounce: number;
}

export interface InspectorSnapshot extends PresentationState {
  hit: InspectorHit | null;
  eventCount: number;
  segmentCount: number;
  maxBounce: number;
  solveMs: number;
}
