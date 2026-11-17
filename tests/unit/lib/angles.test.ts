import { describe, expect, it } from "vitest";
import { degToRad, normalizeAngle, normalizeMirrorAngle, radToDeg } from "@/lib/math/angles";

describe("angles", () => {
  it("converts between degrees and radians", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 12);
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 12);
  });

  it("wraps angles into [0, period) and maps invalid input to zero", () => {
    expect(normalizeAngle(370)).toBe(10);
    expect(normalizeAngle(-10)).toBe(350);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeAngle(45, 0)).toBe(0);
  });

  it("normalizes mirror angles modulo 180 degrees", () => {
    expect(normalizeMirrorAngle(200)).toBe(20);
    expect(normalizeMirrorAngle(-45)).toBe(135);
  });
});
