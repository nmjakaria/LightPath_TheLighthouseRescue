import { describe, expect, it } from "vitest";
import { GameState } from "@/engine/core/GameState";
import { constrainedPosition, movableObstacleAt, worldVertices } from "@/game/movableObstacles";
import { pickComponent, pickSource } from "@/game/picking";
import { lamp, mirrorAt, targetAt, testLevel, WHITE } from "./fixtures";
import type { MovableObstacleRuntime } from "@/types/level";

const FRAME = 1 / 60;

const SLIDE: MovableObstacleRuntime = {
  id: "W1",
  localVertices: [
    { x: -20, y: -20 },
    { x: 20, y: -20 },
    { x: 20, y: 20 },
    { x: -20, y: 20 },
  ],
  start: { x: 400, y: 300 },
  axis: "x",
  range: [300, 500],
  snap: 20,
  position: { x: 400, y: 300 },
};

function aim(state: GameState, id: string, angleDeg: number): void {
  state.apply({ type: "beginRotate", id });
  state.apply({ type: "rotateTo", id, angleDeg });
  state.apply({ type: "endRotate", id });
}

describe("movable obstacles (FR-022)", () => {
  it("snaps to the grid and clamps to the allowed range", () => {
    expect(constrainedPosition(SLIDE, { x: 437, y: 99 })).toEqual({ x: 440, y: 300 });
    expect(constrainedPosition(SLIDE, { x: 900, y: 300 })).toEqual({ x: 500, y: 300 });
    expect(constrainedPosition(SLIDE, { x: 0, y: 300 })).toEqual({ x: 300, y: 300 });
    expect(worldVertices(SLIDE)[0]).toEqual({ x: 380, y: 280 });
    expect(movableObstacleAt({ x: 400, y: 300 }, [SLIDE])).toBe("W1");
  });

  it("updates the solver during a drag and restores the obstacle on undo", () => {
    const verticalSlide: MovableObstacleRuntime = {
      ...SLIDE,
      axis: "y",
      range: [200, 500],
      start: { x: 400, y: 300 },
      position: { x: 400, y: 300 },
    };
    const state = new GameState(
      testLevel({
        sources: [lamp("S1", 120, 300)],
        movableObstacles: [verticalSlide],
        targets: [{ ...targetAt("T1", 800, 300), required: false }],
      }),
    );
    state.tick(FRAME);
    expect(state.result.events[0].objectId).toBe("W1");

    state.apply({ type: "beginDragObstacle", id: "W1" });
    state.apply({ type: "dragObstacleTo", id: "W1", point: { x: 400, y: 520 } });
    expect(state.movableObstacles[0].position).toEqual({ x: 400, y: 500 });
    expect(state.feedback).toBe("outsideRange");
    state.apply({ type: "endDragObstacle", id: "W1" });
    expect(state.moves).toBe(1);

    state.tick(FRAME);
    expect(state.result.events[0].objectId).toBe("T1");
    state.apply({ type: "undo" });
    expect(state.movableObstacles[0].position).toEqual({ x: 400, y: 300 });
    state.tick(FRAME);
    expect(state.result.events[0].objectId).toBe("W1");
  });
});

describe("lamp rotation and locked feedback (FR-023)", () => {
  it("rotates a flagged lamp in angle steps and reports locked lamps", () => {
    const state = new GameState(
      testLevel({
        sources: [lamp("S1", 120, 300, 0, WHITE, true), lamp("S2", 120, 500)],
      }),
    );
    state.apply({ type: "select", id: "S2" });
    state.apply({ type: "rotateStep", direction: 1, fine: false });
    expect(state.sources[1].headingDeg).toBe(0);
    expect(state.feedback).toBe("locked");
    expect(state.moves).toBe(0);

    aim(state, "S1", 90);
    expect(state.sources[0].headingDeg).toBe(90);
    expect(state.moves).toBe(1);
    state.tick(FRAME);
    expect(state.result.segments[0].b.x).toBeCloseTo(120, 6);
    expect(state.result.segments[0].b.y).toBeGreaterThan(300);
  });

  it("picks fixed lamps so the UI can show that they are locked", () => {
    const state = new GameState(
      testLevel({ sources: [lamp("S1", 120, 300), lamp("S2", 120, 500)] }),
    );
    expect(pickSource({ x: 120, y: 500 }, state.sources)).toBe("S2");
    expect(
      pickComponent({ x: 120, y: 500 }, state.mirrors, state.sources, state.movableObstacles),
    ).toEqual({ id: "S2", kind: "source" });
  });
});

describe("keyboard-only play (NFR-015, TC-F02)", () => {
  function scene(): GameState {
    return new GameState(
      testLevel({
        sources: [lamp("S1", 120, 300, 0, WHITE, true)],
        mirrors: [mirrorAt("M1", 500, 300, 0)],
        movableObstacles: [SLIDE],
      }),
    );
  }

  it("cycles mirrors, rotatable lamps and rocks with Tab, including wrap-around", () => {
    const state = scene();
    expect(state.interaction.selectableIds).toEqual(["M1", "S1", "W1"]);
    for (const expected of ["M1", "S1", "W1", "M1"]) {
      state.apply({ type: "cycleSelection", direction: 1 });
      expect(state.selectedId).toBe(expected);
    }
    state.apply({ type: "cycleSelection", direction: -1 });
    expect(state.selectedId).toBe("W1");
    expect(state.moves).toBe(0);
  });

  it("nudges a selected rock one snap step, respects its rail and undoes exactly", () => {
    const state = scene();
    state.apply({ type: "select", id: "W1" });
    expect(state.selectedId).toBe("W1");

    state.apply({ type: "nudgeObstacle", axis: "x", direction: 1 });
    expect(state.movableObstacles[0].position).toEqual({ x: 420, y: 300 });
    expect(state.moves).toBe(1);
    expect(state.dirty).toBe(true);

    state.apply({ type: "nudgeObstacle", axis: "y", direction: -1 });
    expect(state.feedback).toBe("outsideRange");
    expect(state.moves).toBe(1);

    state.apply({ type: "undo" });
    expect(state.movableObstacles[0].position).toEqual({ x: 400, y: 300 });
    expect(state.moves).toBe(1);
  });

  it("stays inside the authored range when nudging repeatedly", () => {
    const state = scene();
    state.apply({ type: "select", id: "W1" });
    for (let index = 0; index < 10; index += 1) {
      state.apply({ type: "nudgeObstacle", axis: "x", direction: -1 });
    }
    expect(state.movableObstacles[0].position).toEqual({ x: 300, y: 300 });
  });
});
