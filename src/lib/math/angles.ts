/*
 * Level data stores degrees; all math runs in radians. Because world y grows down, a positive
 * angle turns clockwise on screen with the usual (cos θ, sin θ) direction convention.
 * Mirror lines repeat every 180°, so normalization accepts a period argument.
 */
import {
  DEG_TO_RAD,
  FULL_TURN_DEG,
  MIRROR_PERIOD_DEG,
  RAD_TO_DEG,
} from "./constants";

export function degToRad(deg: number): number {
  return deg * DEG_TO_RAD;
}

export function radToDeg(rad: number): number {
  return rad * RAD_TO_DEG;
}

/** Wraps an angle into [0, period); non-finite input maps to 0. */
export function normalizeAngle(angle: number, period: number = FULL_TURN_DEG): number {
  if (!Number.isFinite(angle) || period <= 0) return 0;
  const wrapped = angle % period;
  return wrapped < 0 ? wrapped + period : wrapped;
}

/** Mirror angle θ and θ + 180° describe the same line. */
export function normalizeMirrorAngle(deg: number): number {
  return normalizeAngle(deg, MIRROR_PERIOD_DEG);
}

/** Rounds to the nearest step and wraps into one period; mirrors pass a 180° period. */
export function snapAngle(deg: number, step: number, period: number = FULL_TURN_DEG): number {
  if (!Number.isFinite(deg) || step <= 0 || period <= 0) return 0;
  const scaled = Math.round(normalizeAngle(deg, period) / step);
  return normalizeAngle(scaled * step, period);
}
