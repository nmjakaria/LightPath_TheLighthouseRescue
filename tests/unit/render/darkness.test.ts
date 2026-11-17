import { describe, expect, it } from "vitest";
import { fillDarknessSamples } from "@/engine/render/darkness";
import type { Segment } from "@/types/optics";
import type { Vec2 } from "@/types/vec2";

function segment(a: Vec2, b: Vec2): Segment {
  return { a, b, color: { r: 1, g: 1, b: 1 }, intensity: 1, bounce: 0, kind: "beam" };
}

function buffer(size: number): Vec2[] {
  return Array.from({ length: size }, () => ({ x: 0, y: 0 }));
}

describe("darkness mask samples (PRD §12.7)", () => {
  it("samples a segment from start to end within the cap", () => {
    const out = buffer(120);
    const count = fillDarknessSamples(out, [segment({ x: 0, y: 0 }, { x: 1000, y: 0 })], 24, 120);
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(120);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[count - 1].x).toBeCloseTo(1000, 6);
  });

  it("never writes past the caller-owned buffer", () => {
    const out = buffer(3);
    const count = fillDarknessSamples(out, [segment({ x: 0, y: 0 }, { x: 1000, y: 0 })], 10, 120);
    expect(count).toBe(3);
  });

  it("returns zero for no segments or a non-positive cap", () => {
    const out = buffer(4);
    expect(fillDarknessSamples(out, [], 24, 120)).toBe(0);
    expect(fillDarknessSamples(out, [segment({ x: 0, y: 0 }, { x: 10, y: 0 })], 24, 0)).toBe(0);
  });

  it("spreads samples across multiple segments up to the cap", () => {
    const out = buffer(20);
    const segments = [
      segment({ x: 0, y: 0 }, { x: 100, y: 0 }),
      segment({ x: 200, y: 0 }, { x: 300, y: 0 }),
    ];
    const count = fillDarknessSamples(out, segments, 10, 20);
    expect(count).toBe(20);
    expect(out.some((point) => point.x >= 200)).toBe(true);
  });
});
