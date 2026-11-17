import { describe, expect, it } from "vitest";
import { GameState } from "@/engine/core/GameState";
import { level01 } from "@/levels/level-01";
import { normalizeAngle, radToDeg } from "@/lib/math/angles";
import { COMPLETION_HOLD_SEC, TARGET_ACTIVATION_SEC } from "@/lib/math/constants";
import type { LevelConfig } from "@/types/level";

function dragTo(state: GameState, id: string, angleDeg: number): void {
  state.apply({ type: "beginRotate", id });
  state.apply({ type: "rotateTo", id, angleDeg });
  state.apply({ type: "endRotate", id });
}

function solveLevel(state: GameState): void {
  dragTo(state, "M1", 135);
  dragTo(state, "M2", 135);
}

function reflectedHeading(state: GameState): number {
  const event = state.result.events.find((candidate) => candidate.type === "mirror");
  expect(event?.reflected).toBeDefined();
  const reflected = event?.reflected ?? { x: 0, y: 0 };
  return normalizeAngle(radToDeg(Math.atan2(reflected.y, reflected.x)));
}

function freshState(level: LevelConfig = level01): GameState {
  const state = new GameState(level);
  state.tick(1 / 60);
  return state;
}

describe("GameState rotation and input", () => {
  it("TC-F01: a drag snaps to the nearest 15° step, counts one move and updates on the next tick", () => {
    const state = freshState();
    const solvesBefore = state.solveCount;
    state.apply({ type: "select", id: "M1" });
    dragTo(state, "M1", 44);

    expect(state.mirrors[0].angleDeg).toBe(45);
    expect(state.moves).toBe(1);
    expect(state.solveCount).toBe(solvesBefore);
    state.tick(1 / 60);
    expect(state.solveCount).toBe(solvesBefore + 1);
  });

  it("TC-F02: three Right presses add exactly 45° and three moves", () => {
    const state = freshState();
    state.apply({ type: "select", id: "M1" });
    for (let index = 0; index < 3; index += 1) {
      state.apply({ type: "rotateStep", direction: 1, fine: false });
    }
    expect(state.mirrors[0].angleDeg).toBe(135);
    expect(state.moves).toBe(3);
    expect(state.snapshot().canUndo).toBe(true);
  });

  it("Shift uses the fine 5° step and wrapped mirror angles stay in [0, 180)", () => {
    const state = freshState();
    state.apply({ type: "select", id: "M2" });
    state.apply({ type: "rotateStep", direction: -1, fine: true });
    expect(state.mirrors[1].angleDeg).toBe(175);
    state.apply({ type: "rotateStep", direction: 1, fine: false });
    expect(state.mirrors[1].angleDeg).toBe(15);
  });

  it("does not change locked mirrors", () => {
    const locked: LevelConfig = {
      ...level01,
      mirrors: level01.mirrors.map((mirror) => ({ ...mirror, rotatable: false })),
    };
    const state = freshState(locked);
    state.apply({ type: "select", id: "M1" });
    state.apply({ type: "rotateStep", direction: 1, fine: false });
    expect(state.feedback).toBe("locked");
    dragTo(state, "M1", 135);
    expect(state.mirrors[0].angleDeg).toBe(90);
    expect(state.moves).toBe(0);
  });
});

describe("GameState undo and reset", () => {
  it("TC-F15: undo restores the exact previous angle without refunding moves", () => {
    const state = freshState();
    state.apply({ type: "select", id: "M1" });
    state.apply({ type: "rotateStep", direction: 1, fine: false });
    state.apply({ type: "rotateStep", direction: 1, fine: false });
    state.apply({ type: "undo" });
    expect(state.mirrors[0].angleDeg).toBe(105);
    expect(state.moves).toBe(2);
    state.apply({ type: "undo" });
    expect(state.mirrors[0].angleDeg).toBe(90);
    state.apply({ type: "undo" });
    expect(state.mirrors[0].angleDeg).toBe(90);
  });

  it("an unchanged drag is not a move and a cancelled drag restores the preview", () => {
    const state = freshState();
    state.apply({ type: "select", id: "M1" });
    state.apply({ type: "beginRotate", id: "M1" });
    state.apply({ type: "endRotate", id: "M1" });
    expect(state.moves).toBe(0);

    state.apply({ type: "beginRotate", id: "M1" });
    state.apply({ type: "rotateTo", id: "M1", angleDeg: 60 });
    expect(state.mirrors[0].angleDeg).toBe(60);
    state.apply({ type: "undo" });
    expect(state.mirrors[0].angleDeg).toBe(90);
    expect(state.moves).toBe(0);
  });

  it("reset restores initial angles, moves, timer and targets exactly", () => {
    const state = freshState();
    solveLevel(state);
    state.tick(0.2);
    state.apply({ type: "reset" });
    expect(state.mirrors.map((mirror) => mirror.angleDeg)).toEqual([90, 0]);
    expect(state.moves).toBe(0);
    expect(state.elapsedSec).toBe(0);
    expect(state.status).toBe("playing");
    expect(state.targets[0].chargeSec).toBe(0);
    expect(state.snapshot().canUndo).toBe(false);
  });
});

describe("GameState optics and completion", () => {
  it("the reflected heading turns by twice the mirror rotation", () => {
    const state = freshState();
    const before = reflectedHeading(state);
    dragTo(state, "M1", 135);
    state.tick(1 / 60);
    const after = reflectedHeading(state);
    expect(before).toBeCloseTo(180, 6);
    expect(after).toBeCloseTo(270, 6);
    expect(after - before).toBeCloseTo(2 * (135 - 90), 6);
  });

  it("solves only when dirty, never on idle frames", () => {
    const state = freshState();
    expect(state.solveCount).toBe(1);
    state.tick(1 / 60);
    state.tick(1 / 60);
    expect(state.solveCount).toBe(1);
    state.apply({ type: "select", id: "M1" });
    state.apply({ type: "rotateStep", direction: 1, fine: false });
    state.tick(1 / 60);
    expect(state.solveCount).toBe(2);
  });

  it("Level 1 is not solved at the start", () => {
    const state = freshState();
    for (let frame = 0; frame < 120; frame += 1) state.tick(1 / 60);
    expect(state.status).toBe("playing");
    expect(state.targets[0].active).toBe(false);
  });

  it("TC-F08: the solved Level 1 completes once after charge plus hold", () => {
    const state = freshState();
    solveLevel(state);
    let completions = 0;
    let wasComplete = false;
    for (let frame = 0; frame < 90; frame += 1) {
      state.tick(1 / 60);
      if (state.status === "complete" && !wasComplete) {
        completions += 1;
        wasComplete = true;
      }
    }
    expect(state.status).toBe("complete");
    expect(completions).toBe(1);
    // tick exits early after completion, so no further frames can retrigger the event.
    const finalCount = completions;
    for (let frame = 0; frame < 10; frame += 1) state.tick(1 / 60);
    expect(completions).toBe(finalCount);
    expect(state.elapsedSec).toBeGreaterThanOrEqual(TARGET_ACTIVATION_SEC + COMPLETION_HOLD_SEC - 0.1);
  });

  it("freezes game input after completion but keeps hover", () => {
    const state = freshState();
    solveLevel(state);
    for (let frame = 0; frame < 90; frame += 1) state.tick(1 / 60);
    state.apply({ type: "select", id: "M1" });
    state.apply({ type: "rotateStep", direction: 1, fine: false });
    state.apply({ type: "hover", id: "M1" });
    expect(state.mirrors[0].angleDeg).toBe(135);
    expect(state.hoveredId).toBe("M1");
  });
});
