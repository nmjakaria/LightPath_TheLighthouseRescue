import { describe, expect, it } from "vitest";
import { createGlowSpriteCache, type GlowSprite } from "@/engine/render/glowSprites";

function fakeSprite(color: string, radiusPx: number): GlowSprite {
  return {
    image: { color, radiusPx } as unknown as CanvasImageSource,
    sizePx: radiusPx * 2,
  };
}

describe("glow sprite cache", () => {
  it("reuses the same sprite for an identical colour and radius", () => {
    const cache = createGlowSpriteCache(fakeSprite, 4);
    const first = cache.get("#fff", 12);
    const second = cache.get("#fff", 12);
    expect(first).toBe(second);
    expect(cache.size).toBe(1);
  });

  it("keys on both colour and radius", () => {
    const cache = createGlowSpriteCache(fakeSprite, 4);
    const red = cache.get("red", 12);
    const blue = cache.get("blue", 12);
    const larger = cache.get("red", 20);
    expect(red).not.toBe(blue);
    expect(red).not.toBe(larger);
    expect(cache.size).toBe(3);
  });

  it("evicts the oldest entry once the cap is reached", () => {
    const cache = createGlowSpriteCache(fakeSprite, 2);
    const first = cache.get("a", 1);
    cache.get("b", 1);
    cache.get("c", 1);
    expect(cache.size).toBe(2);
    expect(cache.get("a", 1)).not.toBe(first);
  });

  it("clear() empties the cache", () => {
    const cache = createGlowSpriteCache(fakeSprite, 2);
    cache.get("a", 1);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
