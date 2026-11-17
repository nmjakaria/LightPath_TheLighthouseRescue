/* Gate animation from PRD FR-037: the open fraction approaches its target linearly over the
 * configured slide time. The solver only cares which side of the open threshold the fraction is
 * on, so GameState rebuilds optics only when that boolean flips. */
import { gameConfig } from "@/config/gameConfig";

export function approachOpenFraction(current: number, target: number, dt: number): number {
  const bounded = Math.max(0, Math.min(1, Number.isFinite(current) ? current : 0));
  const goal = target >= 1 ? 1 : 0;
  const step = gameConfig.gateSlideSec > 0 ? dt / gameConfig.gateSlideSec : 1;
  if (goal > bounded) return Math.min(goal, bounded + step);
  return Math.max(goal, bounded - step);
}

export function gateBlocks(openFraction: number): boolean {
  return openFraction < gameConfig.optics.gateOpenFraction;
}
