/*
 * Pure helpers for keyboard-only interaction (PRD NFR-015). Tab walks the selectable components in
 * a stable data order; arrow keys then rotate the selection or slide a movable obstacle by exactly
 * one authored grid step. Keeping the arithmetic here leaves GameInteraction small and testable.
 */
import { gameConfig } from "@/config/gameConfig";
import type { MovableObstacleRuntime } from "@/types/level";
import type { Vec2 } from "@/types/vec2";

export interface KeyboardComponents {
  mirrors: readonly { id: string }[];
  sources: readonly { id: string; rotatable: boolean }[];
  movableObstacles: readonly { id: string }[];
}

export function selectableComponentIds(components: KeyboardComponents): string[] {
  return [
    ...components.mirrors.map((mirror) => mirror.id),
    ...components.sources.filter((source) => source.rotatable).map((source) => source.id),
    ...components.movableObstacles.map((obstacle) => obstacle.id),
  ];
}

/** Wraps at both ends so Tab and Shift+Tab always land on a real component. */
export function nextSelectableId(
  ids: readonly string[],
  current: string | null,
  direction: -1 | 1,
): string | null {
  if (ids.length === 0) return null;
  const index = current ? ids.indexOf(current) : -1;
  if (index === -1) return direction === 1 ? ids[0] : ids[ids.length - 1];
  return ids[(index + direction + ids.length) % ids.length];
}

/** One key press equals one snap step so keyboard and pointer moves stay comparable. */
export function keyboardNudgePosition(
  obstacle: MovableObstacleRuntime,
  axis: "x" | "y",
  direction: -1 | 1,
): Vec2 {
  const step = obstacle.snap > 0 ? obstacle.snap : gameConfig.interaction.keyboardNudgeWU;
  const delta = step * direction;
  return axis === "x"
    ? { x: obstacle.position.x + delta, y: obstacle.position.y }
    : { x: obstacle.position.x, y: obstacle.position.y + delta };
}
