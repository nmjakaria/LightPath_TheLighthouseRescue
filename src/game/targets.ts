/* Simplified target rule (PRD §9.2/§9.4): a target charges only from a beam of its required colour
 * and sufficient intensity. Charge decays linearly when the beam moves away; completion waits for
 * every required target to stay active for the configured hold time. */
import { gameConfig } from "@/config/gameConfig";
import type { HitEvent } from "@/types/optics";
import type { LevelTargetConfig, TargetColor } from "@/types/level";
import type { RGB } from "@/types/color";

const CHANNEL_KEYS: Record<Exclude<TargetColor, "any">, keyof RGB> = {
  red: "r",
  green: "g",
  blue: "b",
};

export function colorMatches(required: TargetColor, color: RGB): boolean {
  if (required === "any") return true;
  const threshold = gameConfig.optics.mixedThreshold;
  const channelKey = CHANNEL_KEYS[required];
  const others = (["r", "g", "b"] as const).filter((key) => key !== channelKey);
  return color[channelKey] >= threshold && others.every((key) => color[key] < threshold);
}

export function eventChargesTarget(event: HitEvent, target: LevelTargetConfig): boolean {
  return (
    event.objectId === target.id &&
    event.type === "target" &&
    event.intensity >= gameConfig.targets.minIntensity &&
    colorMatches(target.requires, event.color)
  );
}

export function nextCharge(chargeSec: number, dt: number, lit: boolean): number {
  if (lit) return Math.min(gameConfig.targets.activationSec, chargeSec + dt);
  return Math.max(0, chargeSec - dt * gameConfig.targets.decayFactor);
}
