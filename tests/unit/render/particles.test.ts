import { describe, expect, it } from "vitest";
import { gameConfig } from "@/config/gameConfig";
import { GameState } from "@/engine/core/GameState";
import { ParticleEmitter, type EmitterSettings } from "@/engine/particles/emitters";
import { ParticlePool } from "@/engine/particles/ParticlePool";
import { beamColor } from "@/engine/render/layers/BeamLayer";
import { lamp, mirrorAt, targetAt, testLevel } from "../game/fixtures";
import type { Palette } from "@/engine/render/palette";
import type { RGB } from "@/types/color";

const palette = {
  abyss: "#040813", midnight: "#0a1530", deepNavy: "#11224a", navyLine: "#26417a",
  cyanBeam: "#22d3ee", oceanTeal: "#14b8a6", beamCore: "#e6fbff", softWhite: "#f1f7ff",
  mist: "#9fb3d1", starGold: "#ffd166", lightRed: "#ff4d6d", lightGreen: "#4dff9f",
  lightBlue: "#4d9bff", success: "#34d399", warning: "#fbbf24", danger: "#f87171",
} satisfies Palette;

function settings(quality: EmitterSettings["quality"], reducedMotion = false): EmitterSettings {
  return { quality, reducedMotion, palette, colorFor: (color: RGB) => beamColor(color, palette) };
}

describe("ParticlePool quality caps (TC-G11)", () => {
  it("never exceeds the total cap and drops ambient motes first", () => {
    const low = gameConfig.quality.low;
    const pool = new ParticlePool(low, () => 0.5, 20);
    for (let index = 0; index < 100; index += 1) pool.spawnMote(index, 0, palette.cyanBeam);
    expect(pool.active).toBeLessThanOrEqual(low.particleCap);
    expect(pool.motes).toBe(low.moteCap);

    for (let index = 0; index < 100; index += 1) pool.spawnSpark(0, 0, palette.lightRed, 0);
    expect(pool.active).toBeLessThanOrEqual(low.particleCap);
    expect(pool.motes).toBeLessThanOrEqual(low.moteCap);
  });

  it("trims live motes when quality is lowered at runtime", () => {
    const pool = new ParticlePool(gameConfig.quality.high, () => 0.5, 20);
    for (let index = 0; index < 20; index += 1) pool.spawnMote(index, 0, palette.cyanBeam);
    expect(pool.motes).toBe(20);

    pool.setQuality(gameConfig.quality.low);
    expect(pool.active).toBeLessThanOrEqual(gameConfig.quality.low.particleCap);
    expect(pool.motes).toBeLessThanOrEqual(gameConfig.quality.low.moteCap);
  });

  it("recycles expired slots instead of growing", () => {
    const pool = new ParticlePool(gameConfig.quality.low, () => 0.5, 4);
    expect(pool.spawnSpark(0, 0, palette.lightRed, 0)).toBe(true);
    expect(pool.active).toBe(1);
    pool.update(10, 1, false);
    expect(pool.active).toBe(0);
    expect(pool.spawnSpark(0, 0, palette.lightRed, 0)).toBe(true);
    expect(pool.active).toBe(1);
  });

  it("keeps the emitter under the cap through a full simulated scene", () => {
    const level = testLevel({
      sources: [lamp("lamp", 100, 300, 0)],
      mirrors: [mirrorAt("mirror", 600, 300, 45)],
      targets: [targetAt("target", 900, 300)],
    });
    const state = new GameState(level);
    const pool = new ParticlePool(gameConfig.quality.high, () => 0.5, 160);
    const emitter = new ParticleEmitter(() => 0.5);
    for (let frame = 0; frame < 200; frame += 1) {
      state.tick(0.05);
      emitter.update(0.05, state, pool, settings(gameConfig.quality.high));
      pool.update(0.05, state.elapsedSec, false);
      expect(pool.active).toBeLessThanOrEqual(gameConfig.quality.high.particleCap);
      expect(pool.motes).toBeLessThanOrEqual(gameConfig.quality.high.moteCap);
    }
    expect(pool.active).toBeGreaterThan(0);
  });

  it("emits fewer bursts when reduced motion is active", () => {
    const level = testLevel({ sources: [lamp("lamp", 100, 300, 0)], targets: [targetAt("target", 500, 300)] });
    const state = new GameState(level);
    const normal = new ParticlePool(gameConfig.quality.high, () => 0.5, 160);
    const calm = new ParticlePool(gameConfig.quality.high, () => 0.5, 160);
    const emitter = new ParticleEmitter(() => 0.5);
    state.tick(0.05);
    state.targets[0].active = true;
    emitter.update(0.05, state, normal, settings(gameConfig.quality.high, false));
    const calmEmitter = new ParticleEmitter(() => 0.5);
    calmEmitter.update(0.05, state, calm, settings(gameConfig.quality.high, true));
    expect(normal.active).toBeGreaterThan(calm.active);
  });
});
