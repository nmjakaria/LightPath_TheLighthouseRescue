/* Pointer hit-testing for the play canvas. A click selects the nearest mirror segment, lamp handle
 * or movable obstacle polygon. Locked components are still picked so the engine can show soft
 * feedback; angles use atan2 in y-down space and repeat with the object's natural period. */
import { gameConfig } from "@/config/gameConfig";
import { getMirrorEndpoints } from "@/engine/optics/transform";
import { radToDeg } from "@/lib/math/angles";
import type { LevelMirrorConfig, MovableObstacleRuntime, SourceRuntime } from "@/types/level";
import type { Vec2 } from "@/types/vec2";
import { movableObstacleAt } from "./movableObstacles";

export type PickedComponent = { id: string; kind: "mirror" | "source" | "obstacle" } | null;

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
      nearestId = mirror.id;
    }
  }
  return nearestId;
}

export function pickSource(point: Vec2, sources: readonly SourceRuntime[]): string | null {
  for (const source of sources) {
    if (Math.hypot(point.x - source.position.x, point.y - source.position.y) <= gameConfig.interaction.lampHandleRadius) {
      return source.id;
    }
  }
  return null;
}

export function pickComponent(
  point: Vec2,
  mirrors: readonly LevelMirrorConfig[],
  sources: readonly SourceRuntime[],
  obstacles: readonly MovableObstacleRuntime[],
): PickedComponent {
  const mirrorId = pickMirror(point, mirrors);
  if (mirrorId) return { id: mirrorId, kind: "mirror" };
  const sourceId = pickSource(point, sources);
  if (sourceId) return { id: sourceId, kind: "source" };
  const obstacleId = movableObstacleAt(point, obstacles);
  return obstacleId ? { id: obstacleId, kind: "obstacle" } : null;
}

/** Direction from a component centre to the pointer, in degrees. */
export function pointerAngle(point: Vec2, center: Vec2): number {
  return radToDeg(Math.atan2(point.y - center.y, point.x - center.x));
}
