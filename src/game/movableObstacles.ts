/*
 * Player-movable obstacle rule (PRD FR-022): the polygon keeps its local shape, while its centre
 * slides along one axis between a level-defined range and snaps to that level's grid. The solver
 * receives the world-space vertices, so dragging changes optics on the very next solve.
 */
import { pointInPolygon } from "@/engine/optics/intersect";
import type { Vec2 } from "@/types/vec2";
import type { MovableObstacleRuntime } from "@/types/level";

export function worldVertices(obstacle: MovableObstacleRuntime): Vec2[] {
  return obstacle.localVertices.map((vertex) => ({
    x: vertex.x + obstacle.position.x,
    y: vertex.y + obstacle.position.y,
  }));
}

export function axisCoordinate(point: Vec2, axis: "x" | "y"): number {
  return axis === "x" ? point.x : point.y;
}

export function constrainedPosition(obstacle: MovableObstacleRuntime, pointer: Vec2): Vec2 {
  const [min, max] = obstacle.range;
  const raw = axisCoordinate(pointer, obstacle.axis);
  const clamped = Math.max(min, Math.min(max, Number.isFinite(raw) ? raw : min));
  const snapped = obstacle.snap > 0 ? Math.round(clamped / obstacle.snap) * obstacle.snap : clamped;
  const safe = Math.max(min, Math.min(max, snapped));
  return obstacle.axis === "x" ? { x: safe, y: obstacle.position.y } : { x: obstacle.position.x, y: safe };
}

export function movableObstacleAt(point: Vec2, obstacles: readonly MovableObstacleRuntime[]): string | null {
  for (const obstacle of obstacles) {
    if (pointInPolygon(point, worldVertices(obstacle))) return obstacle.id;
  }
  return null;
}
