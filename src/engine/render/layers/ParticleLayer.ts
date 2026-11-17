/*
 * Draws the pooled particle system in two passes: normal blending for motes, dust and rings,
 * then additive `lighter` blending for sparks, bursts and the shock ring (PRD §12.6/§12.7).
 * The pool owns all state and blending, so this layer is a thin adapter; P skips the pass live.
 */
import type { ParticlePool } from "@/engine/particles/ParticlePool";
import type { GlowSpriteCache } from "@/engine/render/glowSprites";
import type { Layer } from "../Layer";
import type { VisualSettings } from "../visualSettings";

export class ParticleLayer implements Layer {
  readonly name = "particles";

  constructor(
    private readonly pool: ParticlePool,
    private readonly sprites: GlowSpriteCache,
    private readonly visuals?: VisualSettings,
  ) {}

  draw({ ctx }: Parameters<Layer["draw"]>[0]): void {
    if (this.visuals && !this.visuals.particlesEnabled) return;
    this.pool.draw(ctx, this.sprites);
  }
}
