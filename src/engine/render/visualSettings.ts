/* Mutable render settings shared by reference with the layer stack, so quality and reduced-motion
 * changes apply on the next frame without rebuilding the renderer or remounting the canvas. */
import type { QualityPresetValues } from "@/config/gameConfig";

export interface VisualSettings {
  quality: QualityPresetValues;
  reducedMotion: boolean;
}
