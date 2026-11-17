import { describe, expect, it } from "vitest";
import { gameConfig } from "@/config/gameConfig";
import { getHint, nextSolutionStep, type HintGeometry } from "@/game/hints";
import { level01 } from "@/levels/level-01";
import { level05 } from "@/levels/level-05";

describe("hints (FR-045)", () => {
  it("returns tiers 1–3 in order from the authored solution", () => {
    const geometry: HintGeometry = {
      mirrors: level01.mirrors.map((mirror) => ({ id: mirror.id, angleDeg: mirror.angleDeg })),
      sources: [],
      movableObstacles: [],
    };
    expect(getHint(level01, geometry, 1)).toMatchObject({ tier: 1, text: level01.hints[0].text, componentId: null });
    expect(getHint(level01, geometry, 2)).toMatchObject({ tier: 2, componentId: "M1" });
    expect(getHint(level01, geometry, 3)).toMatchObject({ tier: 3, componentId: "M1", angleDeg: 135 });
  });

  it("treats mirror angles modulo 180° and advances past solved steps", () => {
    const geometry: HintGeometry = {
      mirrors: [
        { id: "M1", angleDeg: 315 },
        { id: "M2", angleDeg: 135 },
      ],
      sources: [],
      movableObstacles: [],
    };
    expect(nextSolutionStep(level01, geometry)).toBeNull();
    expect(getHint(level01, geometry, 3).text).toBe(gameConfig.hints.allSetText);
  });

  it("reveals a movable obstacle's solution position on tier 3", () => {
    const solvedAngles = new Map(level05.solution.map((step) => [step.componentId, step.angleDeg]));
    const geometry: HintGeometry = {
      mirrors: level05.mirrors.map((mirror) => ({
        id: mirror.id,
        angleDeg: solvedAngles.get(mirror.id) ?? mirror.angleDeg,
      })),
      sources: level05.sources.map((source) => ({ id: source.id, headingDeg: source.headingDeg })),
      movableObstacles: level05.movableObstacles.map((obstacle) => ({ id: obstacle.id, position: obstacle.start })),
    };
    expect(getHint(level05, geometry, 3)).toMatchObject({
      componentId: "R1",
      position: { x: 680, y: 540 },
    });
  });
});
