/*
 * Single assembly point for the Step 11 visual stack (PRD §12.5–12.7). It owns the shared visual
 * settings, the glow-sprite cache and the particle pool, and returns a tiny controller so React
 * can update quality/reduced-motion live without rebuilding layers or remounting the canvas.
 */
import type { ViewTransform } from "@/engine/core/ViewTransform";
import type { GameState } from "@/engine/core/GameState";
import { ParticleEmitter, type EmitterSettings } from "@/engine/particles/emitters";
import { ParticlePool } from "@/engine/particles/ParticlePool";
import { SceneRenderer } from "./SceneRenderer";
import { BeamLayer, beamColor } from "./layers/BeamLayer";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { ComponentsLayer } from "./layers/ComponentsLayer";
import { DarknessLayer } from "./layers/DarknessLayer";
import { EnvironmentLayer } from "./layers/EnvironmentLayer";
import { InspectorLayer } from "./layers/InspectorLayer";
import { ParticleLayer } from "./layers/ParticleLayer";
import { createGlowSpriteCache } from "./glowSprites";
import type { Palette } from "./palette";
import type { VisualSettings } from "./visualSettings";

export interface VisualRuntime {
  readonly renderer: SceneRenderer;
  /** Mutable by reference; every layer reads the same object each frame. */
  readonly visuals: VisualSettings;
  setSettings(next: VisualSettings): void;
  update(dt: number, state: GameState): void;
}

export function createVisualRuntime(
  view: ViewTransform,
  palette: Palette,
  state: GameState,
  initial: VisualSettings,
): VisualRuntime {
  const visuals: VisualSettings = { ...initial };
  const sprites = createGlowSpriteCache();
  const pool = new ParticlePool(visuals.quality);
  const emitter = new ParticleEmitter();
  const emitterSettings: EmitterSettings = {
    quality: visuals.quality,
    reducedMotion: visuals.reducedMotion,
    palette,
    colorFor: (color) => beamColor(color, palette),
  };

  const renderer = new SceneRenderer(view, [
    new BackgroundLayer(palette),
    new EnvironmentLayer(palette, visuals),
    new ComponentsLayer(palette, state, visuals),
    new BeamLayer(palette, state, visuals),
    new ParticleLayer(pool, sprites, visuals),
    new DarknessLayer(palette, state, sprites),
    new InspectorLayer(palette, state),
  ]);

  return {
    renderer,
    visuals,
    setSettings(next) {
      if (
        visuals.quality === next.quality && visuals.reducedMotion === next.reducedMotion &&
        visuals.glowEnabled === next.glowEnabled && visuals.particlesEnabled === next.particlesEnabled &&
        visuals.colorblindAid === next.colorblindAid
      ) return;
      visuals.quality = next.quality;
      visuals.reducedMotion = next.reducedMotion;
      visuals.glowEnabled = next.glowEnabled;
      visuals.particlesEnabled = next.particlesEnabled;
      visuals.colorblindAid = next.colorblindAid;
      emitterSettings.quality = next.quality;
      emitterSettings.reducedMotion = next.reducedMotion;
      pool.setQuality(next.quality);
    },
    update(dt, current) {
      if (!visuals.particlesEnabled) return;
      emitter.update(dt, current, pool, emitterSettings);
      pool.update(dt, current.elapsedSec, visuals.reducedMotion);
    },
  };
}
