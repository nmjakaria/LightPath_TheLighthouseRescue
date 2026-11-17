/*
 * Simplified educational dispersion model from PRD §12.9: this is a rule-based illustration, not
 * Snell's law. Mixed light (two channels >= 0.2) becomes three single-channel children deviating
 * -Δ, 0 and +Δ; a single-channel ray passes straight through. Each child loses only the configured
 * transmittance factor, so the fan stays deterministic and easy to inspect.
 */
import { gameConfig } from "@/config/gameConfig";
import { degToRad } from "@/lib/math/angles";
import { rotate } from "@/lib/math/vec2";
import type { RGB } from "@/types/color";
import type { Ray } from "@/types/optics";
import type { Vec2 } from "@/types/vec2";

export const WHITE_LIGHT: RGB = { r: 1, g: 1, b: 1 };

type Channel = keyof RGB;

export interface PrismChild {
  dir: Vec2;
  color: RGB;
  intensity: number;
}

export function isMixedColor(color: RGB): boolean {
  const threshold = gameConfig.optics.mixedThreshold;
  return (["r", "g", "b"] as const).filter((channel) => color[channel] >= threshold).length >= 2;
}

function singleChannel(color: RGB): Channel | null {
  const minimum = gameConfig.optics.minIntensity;
  const channels = (["r", "g", "b"] as const).filter((channel) => color[channel] >= minimum);
  return channels.length === 1 ? channels[0] : null;
}

export function prismChildren(ray: Ray, spreadDeg: number): PrismChild[] {
  const intensity = ray.intensity * gameConfig.optics.prismTransmittance;
  const deviations: Readonly<Record<Channel, number>> = {
    r: -spreadDeg,
    g: 0,
    b: spreadDeg,
  };

  if (!isMixedColor(ray.color)) {
    const channel = singleChannel(ray.color);
    return channel ? [{ dir: { ...ray.dir }, color: channelColor(ray.color, channel), intensity }] : [];
  }

  const children: PrismChild[] = [];
  for (const channel of ["r", "g", "b"] as const) {
    if (ray.color[channel] < gameConfig.optics.minIntensity) continue;
    children.push({
      dir: rotate(ray.dir, degToRad(deviations[channel])),
      color: channelColor(ray.color, channel),
      intensity,
    });
  }
  return children;
}

function channelColor(color: RGB, channel: Channel): RGB {
  return { r: channel === "r" ? color.r : 0, g: channel === "g" ? color.g : 0, b: channel === "b" ? color.b : 0 };
}
