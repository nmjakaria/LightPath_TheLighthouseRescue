/* Mutable render settings shared by reference with the layer stack, so quality, reduced-motion and
 * presentation toggles apply on the next frame without rebuilding layers or remounting the canvas. */
import type { QualityPresetValues } from "@/config/gameConfig";

export interface VisualSettings {
  quality: QualityPresetValues;
  reducedMotion: boolean;
  glowEnabled: boolean;
  particlesEnabled: boolean;
}
