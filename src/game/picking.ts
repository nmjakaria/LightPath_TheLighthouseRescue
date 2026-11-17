/* Pointer hit-testing for the play canvas. A click selects a rotatable mirror whose drawn segment
 * lies within the configured pick radius; empty space deselects. Angles use atan2 in y-down space
 * and are reduced to the 180° mirror period before snapping. */
import { gameConfig } from "@/config/gameConfig";
import { getMirrorEndpoints } from "@/engine/optics/transform";
import { radToDeg } from "@/lib/math/angles";
import type { LevelMirrorConfig } from "@/types/level";
import type { Vec2 } from "@/types/vec2";

export function distanceToSegment(point: Vec2, a: Vec2, b: Vec2): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const lengthSq = vx * vx + vy * vy;
  if (lengthSq === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * vx + (point.y - a.y) * vy) / lengthSq));
  return Math.hypot(point.x - (a.x + t * vx), point.y - (a.y + t * vy));
}

export function pickMirror(point: Vec2, mirrors: readonly LevelMirrorConfig[]): string | null {
  let nearestId: string | null = null;
  let nearestDistance = gameConfig.render.selectionRadius;
  for (const mirror of mirrors) {
    const [a, b] = getMirrorEndpoints(mirror);
    const distance = distanceToSegment(point, a, b);
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearestId = mirror.rotatable ? mirror.id : null;
    }
  }
  return nearestId;
}

/** Direction from the mirror centre to the pointer, in degrees. */
export function pointerAngle(point: Vec2, center: Vec2): number {
  return radToDeg(Math.atan2(point.y - center.y, point.x - center.x));
}
