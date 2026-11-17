import { describe, expect, it } from "vitest";
import { GameState } from "@/engine/core/GameState";
import { applySolution } from "@/game/solution";
import { scoreLevel } from "@/game/scoring";
import { level01 } from "@/levels/level-01";
import { level03 } from "@/levels/level-03";
import { level05 } from "@/levels/level-05";
import { isLevelUnlocked, parseProgress, recordCompletion, defaultProgress } from "@/stores/progressStore";

function tick(state: GameState, frames: number): void {
  for (let frame = 0; frame < frames; frame += 1) state.tick(1 / 60);
}

function complete(state: GameState, level = level01): void {
  applySolution(state, level);
  tick(state, 180);
  expect(state.status).toBe("complete");
}

describe("step 10 game rules", () => {
  it("TC-F16: time starts on first input and stops while paused", () => {
    const state = new GameState(level01);
    tick(state, 60);
    expect(state.elapsedSec).toBe(0);

    state.apply({ type: "select", id: "M1" });
    tick(state, 60);
    expect(state.elapsedSec).toBeCloseTo(1, 6);

    state.apply({ type: "pause", paused: true });
    tick(state, 600);
    expect(state.elapsedSec).toBeCloseTo(1, 6);
    expect(state.snapshot().paused).toBe(true);

    state.apply({ type: "pause", paused: false });
    tick(state, 60);
    expect(state.elapsedSec).toBeCloseTo(2, 6);
  });

  it("TC-F12: three hints descend through the tiers and a fourth is ignored", () => {
    const state = new GameState(level01);
    for (const tier of [1, 2, 3] as const) {
      state.apply({ type: "hint" });
      expect(state.hint?.tier).toBe(tier);
      expect(state.hintsRemaining).toBe(3 - tier);
    }
    state.apply({ type: "hint" });
    expect(state.hintsUsed).toBe(3);
    expect(state.hint?.tier).toBe(3);

    state.apply({ type: "reset" });
    expect(state.hintsUsed).toBe(3);
    expect(state.elapsedSec).toBe(0);
    expect(state.snapshot().canUndo).toBe(false);
  });

  it("FR-013/FR-043: completion freezes one score record that includes hint penalties", () => {
    const state = new GameState(level01);
    state.apply({ type: "hint" });
    complete(state);
    const completion = state.completion;
    expect(completion).not.toBeNull();
    expect(completion?.record.hintsUsed).toBe(1);
    expect(completion?.record.moves).toBe(2);
    expect(completion?.record.score).toBe(
      scoreLevel({
        parTimeSec: level01.par.timeSec,
        parMoves: level01.par.moves,
        timeSec: state.elapsedSec,
        moves: state.moves,
        hintsUsed: 1,
      }).score,
    );

    let progress = recordCompletion(defaultProgress(), completion!.record);
    const restored = parseProgress(JSON.parse(JSON.stringify(progress)));
    expect(restored.levels["level-01"].best?.score).toBe(completion!.record.score);
    expect(isLevelUnlocked(restored, 2, false)).toBe(true);
    progress = restored;
    expect(progress.levels["level-01"].completed).toBe(true);
  });

  it("FR-016: the finale holds its celebration before the result screen", () => {
    const state = new GameState(level05);
    complete(state, level05);
    expect(state.celebrationReady).toBe(false);
    tick(state, 120);
    expect(state.celebrationReady).toBe(true);
    expect(state.snapshot().completion?.record.levelId).toBe("level-05");
  });

  it("FR-052: prism tutorials become active only when the mechanic is in play", () => {
    const state = new GameState(level03);
    expect(state.snapshot().tutorials.map((item) => item.id)).toEqual(["L3-prism"]);
    applySolution(state, level03);
    tick(state, 1);
    expect(state.snapshot().tutorials.map((item) => item.id)).toContain("L3-colors");
  });
});
