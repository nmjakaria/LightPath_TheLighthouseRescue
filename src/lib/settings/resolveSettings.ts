/*
 * Saved settings become effective settings at the React boundary: 'auto' quality is measured
 * from the device, 'system' reduced motion is read from the media query, and the chosen preset
 * expands into renderer caps. The engine receives only this resolved object (AGENTS §5.3).
 */
import { gameConfig, type QualityPreset, type QualityPresetValues } from "@/config/gameConfig";
import type { GameSettings } from "@/config/settingsSchema";

export interface SettingsEnvironment {
  prefersReducedMotion: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
}

export interface EffectiveSettings extends Omit<GameSettings, "quality" | "reducedMotion"> {
  quality: QualityPreset;
  reducedMotion: boolean;
  qualityPreset: QualityPresetValues;
}

export function detectEnvironment(): SettingsEnvironment {
  if (typeof window === "undefined") return { prefersReducedMotion: false };
  const prefersReducedMotion =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  const navigator = window.navigator as Navigator & { deviceMemory?: number };
  return {
    prefersReducedMotion,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
  };
}

export function autoQuality(env: SettingsEnvironment): QualityPreset {
  const cores = env.hardwareConcurrency ?? 4;
  const memory = env.deviceMemory ?? 4;
  if (cores <= 4 || memory <= 4) return "low";
  if (cores <= 8 || memory <= 8) return "medium";
  return "high";
}

export function resolveSettings(
  saved: GameSettings,
  env: SettingsEnvironment = detectEnvironment(),
): EffectiveSettings {
  const { quality, reducedMotion, ...rest } = saved;
  const resolvedQuality = quality === "auto" ? autoQuality(env) : quality;
  return {
    ...rest,
    quality: resolvedQuality,
    reducedMotion: reducedMotion === "system" ? env.prefersReducedMotion : reducedMotion === "on",
    qualityPreset: gameConfig.quality[resolvedQuality],
  };
}
