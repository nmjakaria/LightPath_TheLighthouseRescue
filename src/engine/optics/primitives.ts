/*
 * Solver geometry cache. Mirrors, obstacle edges, closed gates, circular components and the four
 * boundary edges become one flat primitive list per solve. Nearest-hit compares ray parameter t;
 * within EPS_U the PRD §20.3 type priority breaks the tie so results never depend on data order.
 */
import { gameConfig } from "@/config/gameConfig";
import { EPS_U } from "@/lib/math/constants";
import type { HitType, OpticsScene, Ray } from "@/types/optics";
import type { Vec2 } from "@/types/vec2";
import { rayVsCircle, rayVsSegment } from "./intersect";
import { mirrorNormal } from "./reflect";
import {
  getBoundarySegments,
  getGateSegment,
  getMirrorEndpoints,
  isFinitePoint,
} from "./transform";

export interface SegmentPrimitive {
  id: string;
  type: Exclude<HitType, "target" | "switch" | "lamp">;
  a: Vec2;
  b: Vec2;
  normal?: Vec2;
}

export interface CirclePrimitive {
  id: string;
  type: "target" | "switch" | "lamp";
  center: Vec2;
  radius: number;
}

export type Primitive = SegmentPrimitive | CirclePrimitive;

export interface Hit {
  primitive: Primitive;
  t: number;
}

const PRIORITY: Record<HitType, number> = {
  obstacle: 0,
  gate: 0,
  mirror: 1,
  prism: 2,
  switch: 3,
  target: 4,
  lamp: 5,
  boundary: 6,
};

const TERMINATION_REASONS = [
  "boundary", "obstacle", "gate", "prism", "target", "switch", "lamp",
  "intensity", "bounce", "segmentCap", "repeat", "invalid", "noHit",
] as const;

export function warnInvalid(message: string): void {
  if (process.env.NODE_ENV !== "production") console.warn(`[optics] ${message}`);
}

export function createTerminations(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const reason of TERMINATION_REASONS) result[reason] = 0;
  return result;
}

export function buildPrimitives(scene: OpticsScene): Primitive[] {
  const primitives: Primitive[] = [];
  for (const mirror of scene.mirrors) {
    const [a, b] = getMirrorEndpoints(mirror);
    if (!isFinitePoint(a) || !isFinitePoint(b)) {
      warnInvalid(`mirror ${mirror.id} has non-finite endpoints; skipped`);
      continue;
    }
    primitives.push({ id: mirror.id, type: "mirror", a, b, normal: mirrorNormal(mirror.angleDeg) });
  }
  for (const obstacle of scene.obstacles ?? []) {
    const vertices = obstacle.vertices;
    for (let index = 0; index < vertices.length; index += 1) {
      primitives.push({
        id: obstacle.id,
        type: "obstacle",
        a: vertices[index],
        b: vertices[(index + 1) % vertices.length],
      });
    }
  }
  for (const gate of scene.gates ?? []) {
    if ((gate.openFraction ?? 0) >= gameConfig.optics.gateOpenFraction) continue;
    const [a, b] = getGateSegment(gate);
    primitives.push({ id: gate.id, type: "gate", a, b });
  }
  for (const circle of scene.circles ?? []) {
    primitives.push({
      id: circle.id,
      type: circle.type,
      center: circle.center,
      radius: circle.radius,
    });
  }
  for (const [a, b] of getBoundarySegments()) {
    primitives.push({ id: "boundary", type: "boundary", a, b });
  }
  return primitives;
}

export function nearestHit(ray: Ray, primitives: readonly Primitive[]): Hit | null {
  let best: Hit | null = null;
  for (const primitive of primitives) {
    if (primitive.id === ray.skipId) continue;
    let t: number | null;
    if ("center" in primitive) {
      t = rayVsCircle(ray.origin, ray.dir, primitive.center, primitive.radius);
    } else {
      t = rayVsSegment(ray.origin, ray.dir, primitive.a, primitive.b);
    }
    if (t === null) continue;
    const takesPriority =
      best === null ||
      t < best.t - EPS_U ||
      (Math.abs(t - best.t) <= EPS_U && PRIORITY[primitive.type] < PRIORITY[best.primitive.type]);
    if (takesPriority) best = { primitive, t };
  }
  return best;
}
