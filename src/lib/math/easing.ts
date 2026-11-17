/*
 * Scalar interpolation helpers for time-based effects (target charge, gate slide, UI fades).
 * lerp is linear; easeOutCubic starts quickly and settles softly as specified in PRD §12.5.
 * Inputs are clamped to [0, 1] so a clamped dt or a late frame cannot overshoot the target.
 */
export function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) ** 3;
}
