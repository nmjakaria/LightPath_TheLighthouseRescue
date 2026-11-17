/*
 * Radial-gradient glow sprites are expensive to create, so each (color, radius) pair is rendered
 * once into a small offscreen canvas and then blitted with drawImage. The cache is injected with a
 * factory so its keying and eviction can be tested without a browser canvas.
 */
import { visualConfig } from "@/config/visualConfig";

export interface GlowSprite {
  image: CanvasImageSource;
  sizePx: number;
}

export type GlowSpriteFactory = (color: string, radiusPx: number) => GlowSprite;

function createCanvasGlow(color: string, radiusPx: number): GlowSprite {
  const size = Math.max(2, Math.ceil(radiusPx * 2));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, color);
    gradient.addColorStop(visualConfig.effects.glowCore, color);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return { image: canvas, sizePx: size };
}

export interface GlowSpriteCache {
  get(color: string, radiusPx: number): GlowSprite;
  readonly size: number;
  clear(): void;
}

export function createGlowSpriteCache(
  factory: GlowSpriteFactory = createCanvasGlow,
  cap: number = visualConfig.effects.glowSpriteCacheCap,
): GlowSpriteCache {
  const cache = new Map<string, GlowSprite>();
  return {
    get(color, radiusPx) {
      const key = `${color}|${radiusPx}`;
      const cached = cache.get(key);
      if (cached) return cached;
      if (cache.size >= cap) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      const sprite = factory(color, radiusPx);
      cache.set(key, sprite);
      return sprite;
    },
    get size() { return cache.size; },
    clear() { cache.clear(); },
  };
}
