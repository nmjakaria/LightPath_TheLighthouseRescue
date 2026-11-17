/*
 * Three-tier hints from PRD FR-045. The authored solution is the single source of truth: tier 1
 * reuses the level's nudge, tier 2 names the next unsolved component, and tier 3 reveals its target
 * angle or slide position. Mirror angles compare modulo 180° because a line has no arrow.
 */
import { gameConfig } from "@/config/gameConfig";
import { normalizeAngle } from "@/lib/math/angles";
import { EPS_U } from "@/lib/math/constants";
import type { LevelConfig, LevelMirrorConfig, LevelSolutionStep, MovableObstacleRuntime, SourceRuntime } from "@/types/level";
import type { Vec2 } from "@/types/vec2";

export interface HintGeometry {
  mirrors: readonly { id: string; angleDeg: number }[];
  sources: readonly { id: string; headingDeg: number }[];
  movableObstacles: readonly { id: string; position: Vec2 }[];
}

export interface HintDisplay {
  tier: 1 | 2 | 3;
  text: string;
  componentId: string | null;
  angleDeg?: number;
  position?: Vec2;
}

function sameModulo(actual: number, expected: number, period: number): boolean {
  const difference = ((actual - expected) % period + period) % period;
  return Math.min(difference, period - difference) <= EPS_U;
}

function samePoint(actual: Vec2 | undefined, expected: Vec2 | undefined): boolean {
  return (
    actual !== undefined && expected !== undefined &&
    Math.abs(actual.x - expected.x) <= EPS_U &&
    Math.abs(actual.y - expected.y) <= EPS_U
  );
}

/** Returns the first solution entry that the player has not matched yet. */
export function nextSolutionStep(level: LevelConfig, geometry: HintGeometry): LevelSolutionStep | null {
  for (const step of level.solution) {
    const mirror = geometry.mirrors.find((item) => item.id === step.componentId);
    if (mirror && step.angleDeg !== undefined) {
      if (!sameModulo(mirror.angleDeg, step.angleDeg, 180)) return step;
      continue;
    }
    const source = geometry.sources.find((item) => item.id === step.componentId);
    if (source && step.angleDeg !== undefined) {
      if (!sameModulo(source.headingDeg, step.angleDeg, 360)) return step;
      continue;
    }
    const obstacle = geometry.movableObstacles.find((item) => item.id === step.componentId);
    if (obstacle && step.position !== undefined) {
      if (!samePoint(obstacle.position, step.position)) return step;
    }
  }
  return null;
}

function hintText(level: LevelConfig, tier: 1 | 2 | 3, fallback: string): string {
  return level.hints[tier - 1]?.text ?? level.hints[0]?.text ?? fallback;
}

/** Creates the HUD hint for one press; the caller owns the hint counter and cap. */
export function getHint(
  level: LevelConfig,
  geometry: HintGeometry,
  tier: 1 | 2 | 3,
): HintDisplay {
  const step = nextSolutionStep(level, geometry);
  const text = step
    ? hintText(level, tier, gameConfig.hints.allSetText)
    : gameConfig.hints.allSetText;
  if (!step || tier === 1) return { tier, text, componentId: null };

  return {
    tier,
    text,
    componentId: step.componentId,
    ...(tier === 3 && step.angleDeg !== undefined ? { angleDeg: step.angleDeg } : {}),
    ...(tier === 3 && step.position !== undefined ? { position: { ...step.position } } : {}),
  };
}

/** Adapts mutable engine components to the pure hint geometry contract. */
export function hintGeometryFrom(
  mirrors: readonly LevelMirrorConfig[],
  sources: readonly SourceRuntime[],
  obstacles: readonly MovableObstacleRuntime[],
): HintGeometry {
  return {
    mirrors: mirrors.map((mirror) => ({ id: mirror.id, angleDeg: mirror.angleDeg })),
    sources: sources.map((source) => ({ id: source.id, headingDeg: source.headingDeg })),
    movableObstacles: obstacles.map((obstacle) => ({ id: obstacle.id, position: { ...obstacle.position } })),
  };
}

/** Keeps headings in [0, 360) for hint comparisons without changing authored level data. */
export function normalizedHeading(headingDeg: number): number {
  return normalizeAngle(headingDeg);
}
