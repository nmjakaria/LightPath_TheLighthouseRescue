/*
 * Builds one immutable solver snapshot from the current mutable systems. Extracted from GameState
 * so optics and rendering share the same circles, gates and movable-obstacle vertices per solve.
 */
import { gameConfig } from "@/config/gameConfig";
import { worldVertices } from "@/game/movableObstacles";
import type {
  GateRuntime,
  LevelConfig,
  LevelMirrorConfig,
  MovableObstacleRuntime,
  SourceRuntime,
  SwitchRuntime,
  TargetRuntime,
} from "@/types/level";
import type { OpticsScene } from "@/types/optics";

export interface SceneInputs {
  level: LevelConfig;
  sources: readonly SourceRuntime[];
  mirrors: readonly LevelMirrorConfig[];
  movableObstacles: readonly MovableObstacleRuntime[];
  switches: readonly SwitchRuntime[];
  gates: readonly GateRuntime[];
  targets: readonly TargetRuntime[];
}

export function buildOpticsScene(input: SceneInputs): OpticsScene {
  return {
    sources: input.sources,
    mirrors: input.mirrors,
    obstacles: [
      ...input.level.obstacles,
      ...input.movableObstacles.map((obstacle) => ({ id: obstacle.id, vertices: worldVertices(obstacle) })),
    ],
    gates: input.gates,
    prisms: input.level.prisms,
    circles: [
      ...input.targets.map((target) => ({
        id: target.id, type: "target" as const, center: target.center, radius: target.radius,
      })),
      ...input.switches.map((input) => ({
        id: input.id, type: "switch" as const, center: input.center, radius: input.radius,
      })),
      ...input.sources.map((source) => ({
        id: source.id,
        type: "lamp" as const,
        center: source.position,
        radius: source.housingRadius ?? gameConfig.optics.lampHousingRadius,
      })),
    ],
  };
}
