import { describe, expect, it } from "vitest";
import { clamp01, easeOutCubic, lerp } from "@/lib/math/easing";

describe("easing", () => {
  it("clamps to [0, 1] and maps non-finite input to zero", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });

  it("interpolates linearly with clamped t", () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(lerp(10, 20, 5)).toBe(20);
  });

  it("eases out with a cubic curve", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 12);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
  });
});
