/*
 * Level 4 darkness mask support (PRD §12.7). Sample points are spaced along beam segments and
 * written into a caller-owned array, so the per-frame mask never allocates geometry objects. The
 * hard sample cap keeps the offscreen `destination-out` pass bounded on complex scenes.
 */
import { visualConfig } from "@/config/visualConfig";
import type { Segment } from "@/types/optics";
import type { Vec2 } from "@/types/vec2";

export function fillDarknessSamples(
  out: Vec2[],
  segments: readonly Segment[],
  step: number = visualConfig.effects.darknessStep,
  cap: number = visualConfig.effects.darknessSampleCap,
): number {
  const limit = Math.min(out.length, Math.max(0, Math.floor(cap)));
  const spacing = step > 0 ? step : visualConfig.effects.darknessStep;
  let count = 0;
  for (const segment of segments) {
    const dx = segment.b.x - segment.a.x;
    const dy = segment.b.y - segment.a.y;
    const length = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(length / spacing));
    for (let index = 0; index <= steps && count < limit; index += 1) {
      const t = index / steps;
      const point = out[count] ?? { x: 0, y: 0 };
      point.x = segment.a.x + dx * t;
      point.y = segment.a.y + dy * t;
      out[count] = point;
      count += 1;
    }
    if (count >= limit) break;
  }
  return count;
}
