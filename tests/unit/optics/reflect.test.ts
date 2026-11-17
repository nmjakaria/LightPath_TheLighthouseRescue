import { describe, expect, it } from "vitest";
import { normalizeAngle, radToDeg } from "@/lib/math/angles";
import { length, scale } from "@/lib/math/vec2";
import { headingToVec } from "@/lib/math/vec2";
import { mirrorNormal, reflect, reflectHeading } from "@/engine/optics/reflect";

/** TC-F03: exact closed-form oracle, independent of the reflection implementation. */
const PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, -45], [0, 90], [30, 0], [45, 45], [60, 120], [90, 135],
  [120, 30], [150, 75], [180, 0], [210, 15], [240, 60], [270, 135],
  [300, 90], [330, 45], [-30, 60], [-75, 120], [15, -20], [99, 37],
  [200, 160], [355, 5],
];

function vectorHeading(x: number, y: number): number {
  return normalizeAngle(radToDeg(Math.atan2(y, x)));
}

describe("optics/reflect (TC-F03)", () => {
  it("matches φ' = 2θ − φ (mod 360°) for 20 angle pairs and preserves unit length", () => {
    for (const [phi, theta] of PAIRS) {
      const dir = headingToVec(phi);
      const reflected = reflect(dir, mirrorNormal(theta));
      expect(vectorHeading(reflected.x, reflected.y)).toBeCloseTo(reflectHeading(phi, theta), 6);
      expect(vectorHeading(reflected.x, reflected.y)).toBeCloseTo(
        normalizeAngle(2 * theta - phi),
        6,
      );
      expect(length(reflected)).toBeCloseTo(1, 9);
    }
  });

  it("is independent of which side of the mirror the ray arrives from", () => {
    const dir = headingToVec(37);
    const normal = mirrorNormal(123);
    const front = reflect(dir, normal);
    const back = reflect(dir, scale(normal, -1));
    expect(back.x).toBeCloseTo(front.x, 9);
    expect(back.y).toBeCloseTo(front.y, 9);
  });

  it("reproduces the PRD worked example: east light on a '/' mirror goes up", () => {
    const reflected = reflect({ x: 1, y: 0 }, mirrorNormal(-45));
    expect(reflected.x).toBeCloseTo(0, 9);
    expect(reflected.y).toBeCloseTo(-1, 9);
    expect(reflectHeading(0, -45)).toBe(270);
  });
});
