import { describe, expect, it } from "vitest";
import { GameState } from "@/engine/core/GameState";
import { level01 } from "@/levels/level-01";
import { getLevelByIndex, getLevelById, LEVELS } from "@/levels";
import { MIRROR_LENGTH, TARGET_RADIUS } from "@/lib/math/constants";

describe("Level 1 data (PRD §13)", () => {
  it("matches the reference coordinates, par and solution", () => {
    expect(level01.id).toBe("level-01");
    expect(level01.name).toBe("First Light");
    expect(level01.difficulty).toBe("tutorial");
    expect(level01.par).toEqual({ timeSec: 45, moves: 3 });
    expect(level01.sources[0].position).toEqual({ x: 120, y: 560 });
    expect(level01.mirrors.map((mirror) => [mirror.center, mirror.angleDeg])).toEqual([
      [{ x: 500, y: 560 }, 90],
      [{ x: 500, y: 260 }, 0],
    ]);
    expect(level01.mirrors.every((mirror) => mirror.length === MIRROR_LENGTH && mirror.rotatable)).toBe(true);
    expect(level01.targets[0]).toMatchObject({
      id: "T1",
      center: { x: 1000, y: 260 },
      radius: TARGET_RADIUS,
      requires: "any",
      required: true,
    });
    expect(level01.solution).toEqual([
      { componentId: "M1", angleDeg: 135 },
      { componentId: "M2", angleDeg: 135 },
    ]);
  });

  it("is registered in the ordered level index", () => {
    expect(LEVELS).toHaveLength(5);
    expect(getLevelById("level-01")).toBe(level01);
    expect(getLevelByIndex(1)).toBe(level01);
  });

  it("solution replay reaches completion", () => {
    const state = new GameState(level01);
    for (const step of level01.solution) {
      const mirror = state.mirrors.find((candidate) => candidate.id === step.componentId);
      expect(mirror).toBeDefined();
      state.apply({ type: "beginRotate", id: step.componentId });
      state.apply({ type: "rotateTo", id: step.componentId, angleDeg: step.angleDeg ?? 0 });
      state.apply({ type: "endRotate", id: step.componentId });
    }
    for (let frame = 0; frame < 90; frame += 1) state.tick(1 / 60);
    expect(state.status).toBe("complete");
    expect(state.result.events[state.result.events.length - 1]?.objectId).toBe("T1");
  });
});
