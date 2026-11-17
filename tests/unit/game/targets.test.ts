import { describe, expect, it } from "vitest";
import { gameConfig } from "@/config/gameConfig";
import { colorMatches, eventChargesTarget, nextCharge } from "@/game/targets";
import { level01 } from "@/levels/level-01";
import type { HitEvent } from "@/types/optics";

const target = level01.targets[0];

function hit(overrides: Partial<HitEvent> = {}): HitEvent {
  return {
    objectId: "T1",
    type: "target",
    point: { x: 1000, y: 260 },
    color: { r: 1, g: 1, b: 1 },
    intensity: 1,
    bounce: 2,
    ...overrides,
  };
}

describe("target colour and charge rules", () => {
  it("accepts any colour for an 'any' target and pure channels for coloured targets", () => {
    expect(colorMatches("any", { r: 0, g: 0, b: 1 })).toBe(true);
    expect(colorMatches("red", { r: 1, g: 0, b: 0 })).toBe(true);
    expect(colorMatches("red", { r: 1, g: 0.5, b: 0 })).toBe(false);
    expect(colorMatches("green", { r: 0, g: 1, b: 0 })).toBe(true);
    expect(colorMatches("blue", { r: 0, g: 0, b: 1 })).toBe(true);
  });

  it("charges only on a matching event with enough intensity", () => {
    expect(eventChargesTarget(hit(), target)).toBe(true);
    expect(eventChargesTarget(hit({ objectId: "T2" }), target)).toBe(false);
    expect(eventChargesTarget(hit({ type: "mirror" }), target)).toBe(false);
    expect(eventChargesTarget(hit({ intensity: gameConfig.targets.minIntensity / 2 }), target)).toBe(false);
  });

  it("clamps charge at the activation threshold and decays toward zero", () => {
    const full = gameConfig.targets.activationSec;
    expect(nextCharge(0, 1, true)).toBe(full);
    expect(nextCharge(full, 1, true)).toBe(full);
    expect(nextCharge(full, 0.1, false)).toBeCloseTo(full - 0.1 * gameConfig.targets.decayFactor, 9);
    expect(nextCharge(0.01, 1, false)).toBe(0);
  });
});
