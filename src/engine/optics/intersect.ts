/*
 * Analytic 2D ray tests. For a segment E = B - A, den = D x E; solving P + tD = A + uE gives
 * t = ((A-P) x E)/den and u = ((A-P) x D)/den, with a hit only for t > T_MIN and u in [0,1].
 * A circle uses the quadratic |P + tD - C|² = r²; polygons test every edge and keep the nearest t.
 */
import { EPS_PARALLEL, EPS_U, T_MIN } from "@/lib/math/constants";
import { dot } from "@/lib/math/vec2";
import type { Vec2 } from "@/types/vec2";

/** Returns the ray parameter t of the nearest hit, or null for a miss. */
export function rayVsSegment(origin: Vec2, dir: Vec2, a: Vec2, b: Vec2): number | null {
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const den = dir.x * ey - dir.y * ex;
  if (Math.abs(den) < EPS_PARALLEL) return null;

  const ax = a.x - origin.x;
  const ay = a.y - origin.y;
  const t = (ax * ey - ay * ex) / den;
  const u = (ax * dir.y - ay * dir.x) / den;
  if (t <= T_MIN || u < -EPS_U || u > 1 + EPS_U) return null;
  return t;
}

/** D is assumed unit length; b = D·(P-C), c = |P-C|²-r², roots are -b ± sqrt(b²-c). */
export function rayVsCircle(origin: Vec2, dir: Vec2, center: Vec2, radius: number): number | null {
  const px = origin.x - center.x;
  const py = origin.y - center.y;
  const c = px * px + py * py - radius * radius;
  const b = dot(dir, { x: px, y: py });
  if (c > 0 && b >= 0) return null;

  const discriminant = b * b - c;
  if (discriminant < 0) return null;
  const root = Math.sqrt(discriminant);
  // From inside a circle the exit root is the one in front of the ray.
  const candidates = c <= 0 ? [-b + root, -b - root] : [-b - root, -b + root];
  for (const t of candidates) {
    if (t > T_MIN) return t;
  }
  return null;
}

/** Convex polygon as a vertex list; edges are implicit and shared corners have EPS_U overlap. */
export function rayVsPolygon(origin: Vec2, dir: Vec2, vertices: readonly Vec2[]): number | null {
  let nearest: number | null = null;
  for (let index = 0; index < vertices.length; index += 1) {
    const t = rayVsSegment(origin, dir, vertices[index], vertices[(index + 1) % vertices.length]);
    if (t !== null && (nearest === null || t < nearest)) nearest = t;
  }
  return nearest;
}

/** Convex inside test: the point must lie on the same side of every directed edge. */
export function pointInPolygon(point: Vec2, vertices: readonly Vec2[]): boolean {
  if (vertices.length < 3) return false;
  let positive = false;
  let negative = false;
  for (let index = 0; index < vertices.length; index += 1) {
    const a = vertices[index];
    const b = vertices[(index + 1) % vertices.length];
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (cross > EPS_U) positive = true;
    else if (cross < -EPS_U) negative = true;
    if (positive && negative) return false;
  }
  return true;
}
