import { describe, expect, it } from "vitest";
import { visualConfig } from "@/config/visualConfig";
import {
  beamDashOffset,
  beamPulse,
  glowScale,
  mistOffset,
  starAlpha,
  sweepAngleDeg,
  waterY,
} from "@/engine/render/animation";

function timeAt(fps: number, seconds: number): number {
  const dt = 1 / fps;
  let total = 0;
  for (let frame = 0; frame < Math.round(fps * seconds); frame += 1) total += dt;
  return total;
}

describe("time-based animation (TC-G10)", () => {
  it("produces the same phase at 30 and 144 FPS for the same elapsed seconds", () => {
    const slow = timeAt(30, 4);
    const fast = timeAt(144, 4);
    expect(slow).toBeCloseTo(fast, 10);
    expect(sweepAngleDeg(slow)).toBeCloseTo(sweepAngleDeg(fast), 9);
    expect(waterY(1, 640, slow, 3)).toBeCloseTo(waterY(1, 640, fast, 3), 9);
    expect(starAlpha(7, slow)).toBeCloseTo(starAlpha(7, fast), 9);
    expect(beamDashOffset(slow)).toBeCloseTo(beamDashOffset(fast), 9);
    expect(mistOffset(slow, 1)).toBeCloseTo(mistOffset(fast, 1), 9);
  });

  it("sweeps at the PRD rate and never exceeds the PRD alpha", () => {
    const { sweep } = visualConfig.animation;
    expect(sweep.alpha).toBeLessThanOrEqual(0.12);
    expect(sweepAngleDeg(10) - sweepAngleDeg(0)).toBeCloseTo(sweep.degreesPerSec * 10, 6);
    expect(beamDashOffset(1)).toBeCloseTo(-visualConfig.animation.beamDashSpeed, 6);
  });

  it("freezes the sweep and dampens pulses under reduced motion", () => {
    expect(sweepAngleDeg(100, true)).toBe(sweepAngleDeg(0, true));
    expect(beamPulse(1.25, true)).toBe(1);
    expect(glowScale(1.25, true)).toBe(1);

    const base = visualConfig.animation.water.baseY - 2 * visualConfig.animation.water.spacing;
    const moving = Math.abs(waterY(2, 100, 10, 4, false) - base);
    const calm = Math.abs(waterY(2, 100, 10, 4, true) - base);
    expect(calm).toBeLessThan(moving);
  });

  it("keeps twinkle alpha within the configured bounds", () => {
    const { alphaBase, alphaSwing } = visualConfig.animation.stars;
    for (let index = 0; index < visualConfig.animation.stars.count; index += 1) {
      for (let time = 0; time < 12; time += 0.37) {
        const alpha = starAlpha(index, time);
        expect(alpha).toBeGreaterThanOrEqual(alphaBase - alphaSwing - 1e-9);
        expect(alpha).toBeLessThanOrEqual(alphaBase + alphaSwing + 1e-9);
      }
    }
  });
});
