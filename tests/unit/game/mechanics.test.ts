import { describe, expect, it } from "vitest";
import { GameState } from "@/engine/core/GameState";
import { gameConfig } from "@/config/gameConfig";
import { GREEN, RED, lamp, switchAt, targetAt, testLevel, WHITE } from "./fixtures";

const FRAME = 1 / 60;

function run(state: GameState, frames: number): void {
  for (let index = 0; index < frames; index += 1) state.tick(FRAME);
}

function aim(state: GameState, id: string, angleDeg: number): void {
  state.apply({ type: "beginRotate", id });
  state.apply({ type: "rotateTo", id, angleDeg });
  state.apply({ type: "endRotate", id });
}

function switchGateLevel(): ReturnType<typeof testLevel> {
  return testLevel({
    sources: [lamp("S1", 120, 300, 0, WHITE, true), lamp("S2", 120, 500)],
    switches: [switchAt("SW1", 400, 300, "G1")],
    gates: [{ id: "G1", a: { x: 700, y: 450 }, b: { x: 700, y: 550 }, thickness: 8 }],
    targets: [{ ...targetAt("T1", 900, 500), required: false }],
  });
}

describe("GameState target colour and switch rules (TC-F06, F14)", () => {
  it("TC-F06: a red target charges in 0.35 s from red light but never from green", () => {
    const red = new GameState(
      testLevel({
        sources: [lamp("S1", 120, 300, 0, RED)],
        targets: [{ ...targetAt("TR", 600, 300, "red"), required: true }],
      }),
    );
    run(red, 20);
    expect(red.targets[0].active).toBe(false);
    red.tick(FRAME);
    expect(red.targets[0].active).toBe(true);

    const green = new GameState(
      testLevel({
        sources: [lamp("S1", 120, 300, 0, GREEN)],
        targets: [{ ...targetAt("TR", 600, 300, "red"), required: true }],
      }),
    );
    run(green, 120);
    expect(green.targets[0].chargeSec).toBe(0);
    expect(green.targets[0].active).toBe(false);
    expect(green.status).toBe("playing");
  });

  it("TC-F14: a lit switch opens the gate; losing the beam closes it again", () => {
    const state = new GameState(switchGateLevel());
    run(state, 30);
    expect(state.switches[0].active).toBe(true);
    expect(state.gates[0].openFraction).toBeCloseTo(1, 6);
    expect(state.snapshot().openGates).toBe(1);

    run(state, 30);
    expect(state.targets[0].active).toBe(true);

    aim(state, "S1", 90);
    run(state, 60);
    expect(state.switches[0].active).toBe(false);
    expect(state.gates[0].openFraction).toBeCloseTo(0, 6);
    expect(state.snapshot().openGates).toBe(0);
    expect(state.targets[0].active).toBe(false);
  });

  it("TC-X06: repeated switch toggles never produce a non-finite gate fraction", () => {
    const state = new GameState(switchGateLevel());
    for (let burst = 0; burst < 100; burst += 1) {
      aim(state, "S1", burst % 2 === 0 ? 0 : 90);
      run(state, 6);
      expect(Number.isFinite(state.gates[0].openFraction)).toBe(true);
      expect(state.gates[0].openFraction).toBeGreaterThanOrEqual(0);
      expect(state.gates[0].openFraction).toBeLessThanOrEqual(1);
    }
  });

  it("all required targets must be active for the completion hold", () => {
    const state = new GameState(
      testLevel({
        sources: [lamp("R", 120, 300, 0, RED), lamp("G", 120, 500, 0, GREEN)],
        targets: [
          { ...targetAt("TR", 600, 300, "red"), required: true },
          { ...targetAt("TG", 600, 500, "green"), required: true },
        ],
      }),
    );
    run(state, Math.ceil((gameConfig.targets.activationSec + gameConfig.targets.completionHoldSec) * 60) + 2);
    expect(state.targets.map((target) => target.active)).toEqual([true, true]);
    expect(state.status).toBe("complete");
  });
});
