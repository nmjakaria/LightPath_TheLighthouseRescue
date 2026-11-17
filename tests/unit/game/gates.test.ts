import { describe, expect, it } from "vitest";
import { gameConfig } from "@/config/gameConfig";
import { approachOpenFraction, gateBlocks } from "@/game/gates";

const FRAME = 1 / 60;

describe("game/gates (FR-037, TC-X06)", () => {
  it("slides linearly over the configured duration and clamps invalid input", () => {
    const step = FRAME / gameConfig.gateSlideSec;
    expect(approachOpenFraction(0, 1, FRAME)).toBeCloseTo(step, 9);
    expect(approachOpenFraction(0, 1, gameConfig.gateSlideSec)).toBe(1);
    expect(approachOpenFraction(1, 0, gameConfig.gateSlideSec)).toBe(0);
    expect(approachOpenFraction(Number.NaN, 1, FRAME)).toBeCloseTo(step, 9);
  });

  it("uses one threshold for both the solver and the HUD", () => {
    expect(gateBlocks(gameConfig.optics.gateOpenFraction - 0.01)).toBe(true);
    expect(gateBlocks(gameConfig.optics.gateOpenFraction)).toBe(false);
  });

  it("TC-X06: keeps a 10 Hz toggled gate finite and bounded for 10 seconds", () => {
    let fraction = 0;
    for (let frame = 0; frame < 600; frame += 1) {
      const target = frame % 12 < 6 ? 1 : 0;
      fraction = approachOpenFraction(fraction, target, FRAME);
      expect(Number.isFinite(fraction)).toBe(true);
      expect(fraction).toBeGreaterThanOrEqual(0);
      expect(fraction).toBeLessThanOrEqual(1);
    }
  });
});
