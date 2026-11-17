/*
 * Applies an authored level solution through the same command queue as real input (TC-F13). Using
 * commands rather than writing geometry directly proves that the solution is reachable by a player,
 * including snapping, drag commit and move counting.
 */
import type { InputCommand } from "@/types/input";
import type { LevelConfig } from "@/types/level";

export interface SolutionTarget {
  apply(command: InputCommand): void;
}

function componentKind(level: LevelConfig, id: string): "mirror" | "source" | "obstacle" | null {
  if (level.mirrors.some((mirror) => mirror.id === id)) return "mirror";
  if (level.sources.some((source) => source.id === id)) return "source";
  if (level.movableObstacles.some((obstacle) => obstacle.id === id)) return "obstacle";
  return null;
}

/** Replays every solution step; invalid steps are ignored so validation can report them separately. */
export function applySolution(target: SolutionTarget, level: LevelConfig): void {
  for (const step of level.solution) {
    const kind = componentKind(level, step.componentId);
    if (kind === "obstacle" && step.position) {
      target.apply({ type: "beginDragObstacle", id: step.componentId });
      target.apply({ type: "dragObstacleTo", id: step.componentId, point: step.position });
      target.apply({ type: "endDragObstacle", id: step.componentId });
    } else if (kind !== "obstacle" && step.angleDeg !== undefined) {
      target.apply({ type: "beginRotate", id: step.componentId });
      target.apply({ type: "rotateTo", id: step.componentId, angleDeg: step.angleDeg });
      target.apply({ type: "endRotate", id: step.componentId });
    }
  }
}
