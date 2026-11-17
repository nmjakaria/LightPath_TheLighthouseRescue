/*
 * Level 4 darkness mask (PRD §12.7). An offscreen canvas is filled with translucent navy, then
 * pre-rendered radial sprites punch holes at bounded sample points along the beam with
 * `destination-out`. The finished mask is blitted over the scene so only lit corridors show.
 */
import { visualConfig } from "@/config/visualConfig";
import { fillDarknessSamples } from "@/engine/render/darkness";
import type { GameState } from "@/engine/core/GameState";
import type { GlowSpriteCache } from "@/engine/render/glowSprites";
import { WORLD } from "@/lib/math/constants";
import type { Vec2 } from "@/types/vec2";
import type { Layer } from "../Layer";
import type { Palette } from "../palette";

const { effects } = visualConfig;

export class DarknessLayer implements Layer {
  readonly name = "darkness";
  private readonly samples: Vec2[] = Array.from(
    { length: effects.darknessSampleCap },
    () => ({ x: 0, y: 0 }),
  );
  private cache: HTMLCanvasElement | null = null;

  constructor(
    private readonly palette: Palette,
    private readonly state: GameState,
    private readonly sprites: GlowSpriteCache,
  ) {}

  draw({ ctx }: Parameters<Layer["draw"]>[0]): void {
    if (!this.state.level.darkness) return;
    const mask = this.ensureCache();
    const maskCtx = mask?.getContext("2d");
    if (!mask || !maskCtx) return;

    maskCtx.setTransform(1, 0, 0, 1, 0, 0);
    maskCtx.clearRect(0, 0, WORLD.width, WORLD.height);
    maskCtx.globalCompositeOperation = "source-over";
    maskCtx.globalAlpha = effects.darknessAlpha;
    maskCtx.fillStyle = this.palette.deepNavy;
    maskCtx.fillRect(0, 0, WORLD.width, WORLD.height);
    maskCtx.globalAlpha = 1;

    maskCtx.globalCompositeOperation = "destination-out";
    const hole = this.sprites.get(this.palette.softWhite, effects.darknessHoleRadius);
    const count = fillDarknessSamples(this.samples, this.state.result.segments);
    for (let index = 0; index < count; index += 1) {
      const point = this.samples[index];
      maskCtx.drawImage(
        hole.image,
        point.x - effects.darknessHoleRadius,
        point.y - effects.darknessHoleRadius,
        hole.sizePx,
        hole.sizePx,
      );
    }
    maskCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(mask, 0, 0, WORLD.width, WORLD.height);
  }

  dispose(): void {
    this.cache = null;
  }

  private ensureCache(): HTMLCanvasElement | null {
    if (typeof document === "undefined") return null;
    if (!this.cache) {
      this.cache = document.createElement("canvas");
      this.cache.width = WORLD.width;
      this.cache.height = WORLD.height;
    }
    return this.cache;
  }
}
