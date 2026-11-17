import { describe, expect, it } from "vitest";
import { GameState } from "@/engine/core/GameState";
import { requiredTargetsActive } from "@/game/completion";
import { validateLevel } from "@/game/levelValidator";
import { applySolution } from "@/game/solution";
import { LEVELS } from "@/levels";

function replay(levelIndex: number): GameState {
  const level = LEVELS[levelIndex - 1];
  expect(level).toBeDefined();
  const state = new GameState(level);
  applySolution(state, level);
  for (let frame = 0; frame < 300; frame += 1) state.tick(1 / 60);
  return state;
}

describe("all five levels (TC-F13, FR-012)", () => {
  it.each(LEVELS)("$id validates without errors", (level) => {
    const result = validateLevel(level);
    expect(result.errors).toEqual([]);
  });

  it.each(LEVELS)("$id does not start solved", (level) => {
    const state = new GameState(level);
    for (let frame = 0; frame < 180; frame += 1) state.tick(1 / 60);
    expect(state.status).toBe("playing");
    expect(requiredTargetsActive(state.targets)).toBe(false);
  });

  it.each(LEVELS.map((level) => level.index))("TC-F13: level %i solution replay completes", (index) => {
    const state = replay(index);
    expect(requiredTargetsActive(state.targets)).toBe(true);
    expect(state.status).toBe("complete");
  });
});
