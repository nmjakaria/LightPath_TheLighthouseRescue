import { describe, expect, it } from "vitest";
import {
  keyboardNudgePosition,
  nextSelectableId,
  selectableComponentIds,
  type KeyboardComponents,
} from "@/engine/core/keyboardActions";
import type { MovableObstacleRuntime } from "@/types/level";

const COMPONENTS: KeyboardComponents = {
  mirrors: [{ id: "M1" }, { id: "M2" }],
  sources: [
    { id: "S1", rotatable: true },
    { id: "S2", rotatable: false },
  ],
  movableObstacles: [{ id: "W1" }],
};

const ROCK: MovableObstacleRuntime = {
  id: "W1",
  localVertices: [{ x: 0, y: 0 }],
  start: { x: 400, y: 300 },
  axis: "x",
  range: [300, 500],
  snap: 20,
  position: { x: 400, y: 300 },
};

describe("keyboard-only component selection (NFR-015)", () => {
  it("lists mirrors, rotatable sources and rocks in stable data order", () => {
    expect(selectableComponentIds(COMPONENTS)).toEqual(["M1", "M2", "S1", "W1"]);
  });

  it("wraps Tab and Shift+Tab at both ends and handles an empty scene", () => {
    const ids = selectableComponentIds(COMPONENTS);
    expect(nextSelectableId(ids, null, 1)).toBe("M1");
    expect(nextSelectableId(ids, null, -1)).toBe("W1");
    expect(nextSelectableId(ids, "M2", 1)).toBe("S1");
    expect(nextSelectableId(ids, "M1", -1)).toBe("W1");
    expect(nextSelectableId(ids, "unknown", 1)).toBe("M1");
    expect(nextSelectableId([], null, 1)).toBeNull();
  });

  it("nudges by one authored snap step on either axis and falls back to config", () => {
    expect(keyboardNudgePosition(ROCK, "x", 1)).toEqual({ x: 420, y: 300 });
    expect(keyboardNudgePosition(ROCK, "y", -1)).toEqual({ x: 400, y: 280 });
    expect(keyboardNudgePosition({ ...ROCK, snap: 0 }, "x", -1)).toEqual({ x: 380, y: 300 });
  });
});
