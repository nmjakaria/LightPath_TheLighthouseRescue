/*
 * Matrices are row-major triples [m00 m01 m02; m10 m11 m12; m20 m21 m22] acting on (x, y, 1).
 * translate/rotate/scale build the standard homogeneous transforms; multiply(a, b) applies b
 * first. Rotation about a pivot is T(c)·R(θ)·T(−c). invert returns null for singular matrices.
 */
import type { Vec2 } from "@/types/vec2";
import { EPS_PARALLEL } from "./constants";

export type Mat3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function translate(tx: number, ty: number): Mat3 {
  return [1, 0, tx, 0, 1, ty, 0, 0, 1];
}

export function scale(sx: number, sy: number): Mat3 {
  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}

export function rotate(angleRad: number): Mat3 {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

export function multiply(a: Mat3, b: Mat3): Mat3 {
  const result = new Array<number>(9);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      let sum = 0;
      for (let k = 0; k < 3; k += 1) {
        sum += a[row * 3 + k] * b[k * 3 + col];
      }
      result[row * 3 + col] = sum;
    }
  }
  return result as unknown as Mat3;
}

/** Transforms a point, dividing by the homogeneous w component for general 3x3 matrices. */
export function apply(m: Mat3, p: Vec2): Vec2 {
  const w = m[6] * p.x + m[7] * p.y + m[8];
  if (w === 0 || !Number.isFinite(w)) return { x: 0, y: 0 };
  return {
    x: (m[0] * p.x + m[1] * p.y + m[2]) / w,
    y: (m[3] * p.x + m[4] * p.y + m[5]) / w,
  };
}

/** Inverts a general 3x3 matrix via its adjugate; null means the matrix is singular. */
export function invert(m: Mat3): Mat3 | null {
  const [a, b, c, d, e, f, g, h, i] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (!Number.isFinite(det) || Math.abs(det) < EPS_PARALLEL) return null;

  return [
    (e * i - f * h) / det,
    (c * h - b * i) / det,
    (b * f - c * e) / det,
    (f * g - d * i) / det,
    (a * i - c * g) / det,
    (c * d - a * f) / det,
    (d * h - e * g) / det,
    (b * g - a * h) / det,
    (a * e - b * d) / det,
  ];
}

/** Builds T(c)·R(θ)·T(−c), the transform used to spin components about their centers. */
export function rotateAboutPivot(center: Vec2, angleRad: number): Mat3 {
  return multiply(
    translate(center.x, center.y),
    multiply(rotate(angleRad), translate(-center.x, -center.y)),
  );
}
