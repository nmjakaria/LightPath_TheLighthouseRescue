/* G/P toggles must be visible in the renderer itself, not only in the HUD: glow falls back to one
 * core pass and the particle layer skips its draw call while the pools remain allocated. */
import { describe, expect, it } from "vitest";
import type { GameState } from "@/engine/core/GameState";
import { ViewTransform } from "@/engine/core/ViewTransform";
import type { FrameContext } from "@/engine/render/Layer";
import type { GlowSpriteCache } from "@/engine/render/glowSprites";
import { BeamLayer } from "@/engine/render/layers/BeamLayer";
import { ParticleLayer } from "@/engine/render/layers/ParticleLayer";
import type { Palette } from "@/engine/render/palette";
import type { VisualSettings } from "@/engine/render/visualSettings";
import type { ParticlePool } from "@/engine/particles/ParticlePool";
import type { Segment } from "@/types/optics";

const palette = {
  abyss: "#040813", midnight: "#0a1530", deepNavy: "#11224a", navyLine: "#26417a",
  cyanBeam: "#22d3ee", oceanTeal: "#14b8a6", beamCore: "#e6fbff", softWhite: "#f1f7ff",
  mist: "#9fb3d1", starGold: "#ffd166", lightRed: "#ff4d6d", lightGreen: "#4dff9f",
  lightBlue: "#4d9bff", success: "#34d399", warning: "#fbbf24", danger: "#f87171",
} satisfies Palette;

const segment: Segment = {
  a: { x: 0, y: 0 }, b: { x: 100, y: 0 }, color: { r: 1, g: 1, b: 1 },
  intensity: 1, bounce: 0, kind: "beam",
};

function beamState(): GameState {
  return {
    result: { segments: [segment], events: [], stats: { segmentCount: 1, maxBounce: 0, terminated: {}, solveMs: 0 } },
  } as unknown as GameState;
}

function visuals(overrides: Partial<VisualSettings> = {}): VisualSettings {
  return {
    quality: { glowPasses: 3 } as VisualSettings["quality"],
    reducedMotion: true,
    glowEnabled: true,
    particlesEnabled: true,
    colorblindAid: true,
    ...overrides,
  };
}

function frame(ctx: CanvasRenderingContext2D): FrameContext {
  return {
    ctx,
    view: new ViewTransform(),
    stats: { elapsedSec: 1, dt: 0, frameMs: 16, fps: 60, frames: 1 },
  };
}

function countingContext() {
  let strokes = 0;
  const ctx = {
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, setLineDash() {},
    stroke() { strokes += 1; },
    globalCompositeOperation: "", lineCap: "", lineJoin: "", strokeStyle: "", globalAlpha: 1, lineWidth: 1,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, count: () => strokes };
}

describe("presentation toggles in the renderer", () => {
  it("G reduces the beam to its core pass", () => {
    const glow = countingContext();
    new BeamLayer(palette, beamState(), visuals()).draw(frame(glow.ctx));
    const plain = countingContext();
    new BeamLayer(palette, beamState(), visuals({ glowEnabled: false })).draw(frame(plain.ctx));
    expect(glow.count()).toBe(3);
    expect(plain.count()).toBe(1);
  });

  it("P skips particle drawing without changing the pool", () => {
    let draws = 0;
    const pool = { draw() { draws += 1; } } as unknown as ParticlePool;
    const sprites = {} as GlowSpriteCache;
    const { ctx } = countingContext();
    new ParticleLayer(pool, sprites, visuals({ particlesEnabled: false })).draw(frame(ctx));
    expect(draws).toBe(0);
    new ParticleLayer(pool, sprites, visuals()).draw(frame(ctx));
    expect(draws).toBe(1);
  });
});
