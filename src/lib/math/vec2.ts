/*
 * Planar vectors are plain {x, y} objects in the y-down world. A heading φ becomes the unit
 * vector (cos φ, sin φ); rotating that vector by +90° therefore points down, not up.
 * cross(a, b) is the scalar z component a.x*b.y - a.y*b.x used by ray-segment intersection.
 */
import type { Vec2 } from "@/types/vec2";
import { degToRad } from "./angles";

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, y: v.y * k };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

export function lengthSq(v: Vec2): number {
  return v.x * v.x + v.y * v.y;
}

export function length(v: Vec2): number {
  return Math.sqrt(lengthSq(v));
}

/** Returns a unit vector; the zero vector has no direction, so it maps to (0, 0) with no NaN. */
export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
}

/** Rotates a vector by an angle in radians; positive turns clockwise on screen. */
export function rotate(v: Vec2, angleRad: number): Vec2 {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/** Converts a heading in degrees to a unit direction vector (0° = east). */
export function headingToVec(deg: number): Vec2 {
  return rotate({ x: 1, y: 0 }, degToRad(deg));
}
