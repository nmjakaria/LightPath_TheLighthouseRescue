/* Undo snapshots cover every mutable piece of level geometry: mirror angles, lamp headings and
 * movable-obstacle positions. Keeping the snapshot shape here lets GameState restore an attempt
 * exactly without duplicating initial level data. */
import type {
  LevelConfig,
  LevelMirrorConfig,
  MovableObstacleRuntime,
  SourceRuntime,
} from "@/types/level";
import type { Vec2 } from "@/types/vec2";

export interface GeometrySnapshot {
  angles: readonly number[];
  headings: readonly number[];
  positions: readonly Vec2[];
}

export function snapshotGeometry(
  mirrors: readonly LevelMirrorConfig[],
  sources: readonly SourceRuntime[],
  obstacles: readonly MovableObstacleRuntime[],
): GeometrySnapshot {
  return {
    angles: mirrors.map((mirror) => mirror.angleDeg),
    headings: sources.map((source) => source.headingDeg),
    positions: obstacles.map((obstacle) => ({ ...obstacle.position })),
  };
}

export function initialGeometry(level: LevelConfig): GeometrySnapshot {
  return {
    angles: level.mirrors.map((mirror) => mirror.angleDeg),
    headings: level.sources.map((source) => source.headingDeg),
    positions: level.movableObstacles.map((obstacle) => ({ ...obstacle.start })),
  };
}

export function restoreGeometry(
  snapshot: GeometrySnapshot,
  mirrors: LevelMirrorConfig[],
  sources: SourceRuntime[],
  obstacles: MovableObstacleRuntime[],
): void {
  mirrors.forEach((mirror, index) => { mirror.angleDeg = snapshot.angles[index]; });
  sources.forEach((source, index) => { source.headingDeg = snapshot.headings[index]; });
  obstacles.forEach((obstacle, index) => { obstacle.position = { ...snapshot.positions[index] }; });
}
