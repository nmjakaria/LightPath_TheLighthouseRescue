import { describe, expect, it } from "vitest";
import { MIRROR_LENGTH } from "@/lib/math/constants";
import {
  distanceToSegment,
  hitTestPreview,
  mirrorEndpoints,
} from "@/engine/render/layers/PlaceholderSceneLayer";

interface PreviewMirror {
  id: string;
  center: { x: number; y: number };
  angleDeg: number;
}

describe("STEP 6 preview scene hit-testing", () => {
  it("builds mirror endpoints with the configured length and correct clockwise tilt", () => {
    const mirror: PreviewMirror = { id: "M", center: { x: 500, y: 500 }, angleDeg: 135 };
    const [a, b] = mirrorEndpoints(mirror);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(MIRROR_LENGTH, 9);
    expect((a.x + b.x) / 2).toBeCloseTo(500, 9);
    expect((a.y + b.y) / 2).toBeCloseTo(500, 9);
    // At 135° the local +x axis points left-down, so endpoint A is right-up of the centre.
    expect(a.x).toBeGreaterThan(500);
    expect(a.y).toBeLessThan(500);
  });

  it("measures perpendicular distance and clamps to segment ends", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 100, y: 0 };
    expect(distanceToSegment({ x: 50, y: 5 }, a, b)).toBeCloseTo(5, 9);
    expect(distanceToSegment({ x: -10, y: 0 }, a, b)).toBeCloseTo(10, 9);
    expect(distanceToSegment({ x: 110, y: 0 }, a, b)).toBeCloseTo(10, 9);
    expect(distanceToSegment({ x: 5, y: 5 }, a, a)).toBeCloseTo(Math.SQRT1_2 * 10, 9);
  });

  it("hits the two preview mirrors and the target, and rejects empty space", () => {
    expect(hitTestPreview(null)).toBeNull();
    expect(hitTestPreview({ x: 500, y: 560 })).toBe("M1");
    expect(hitTestPreview({ x: 500, y: 260 })).toBe("M2");
    expect(hitTestPreview({ x: 1000, y: 260 })).toBe("T1");
    expect(hitTestPreview({ x: 1000, y: 320 })).toBeNull();
    expect(hitTestPreview({ x: 50, y: 50 })).toBeNull();
  });
});
