/*
 * Specular reflection in the y-down world. The mirror line has tangent (cosθ, sinθ) and normal
 * n = (-sinθ, cosθ); reflecting d about that line is r = d - 2(d·n)n. Because n appears twice,
 * the mirror is double-sided. With heading φ the closed-form oracle is φ' = 2θ - φ (mod 360°).
 */
import { degToRad, normalizeAngle } from "@/lib/math/angles";
import { dot, normalize, scale, sub } from "@/lib/math/vec2";
import type { Vec2 } from "@/types/vec2";

export function mirrorNormal(angleDeg: number): Vec2 {
  const angle = degToRad(angleDeg);
  return { x: -Math.sin(angle), y: Math.cos(angle) };
}

export function reflect(dir: Vec2, normal: Vec2): Vec2 {
  const projected = dot(dir, normal);
  // Renormalize every bounce so many reflections cannot drift away from unit length.
  return normalize(sub(dir, scale(normal, 2 * projected)));
}

export function reflectHeading(headingDeg: number, mirrorAngleDeg: number): number {
  return normalizeAngle(2 * mirrorAngleDeg - headingDeg);
}
