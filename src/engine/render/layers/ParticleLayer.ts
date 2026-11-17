/*
 * Draws the pooled particle system in two passes: normal blending for motes, dust and rings,
 * then additive `lighter` blending for sparks, bursts and the shock ring (PRD §12.6/§12.7).
 * The pool owns all state and blending, so this layer is intentionally a thin adapter.
 */
import type { ParticlePool } from "@/engine/particles/ParticlePool";
import type { GlowSpriteCache } from "@/engine/render/glowSprites";
import type { Layer } from "../Layer";

export class ParticleLayer implements Layer {
  readonly name = "particles";

  constructor(
    private readonly pool: ParticlePool,
    private readonly sprites: GlowSpriteCache,
  ) {}

  draw({ ctx }: Parameters<Layer["draw"]>[0]): void {
    this.pool.draw(ctx, this.sprites);
  }
}
