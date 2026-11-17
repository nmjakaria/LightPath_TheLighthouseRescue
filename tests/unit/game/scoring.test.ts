import { describe, expect, it } from "vitest";
import { gameConfig } from "@/config/gameConfig";
import { buildScoreRecord, scoreFromLevel, scoreLevel, starsForScore } from "@/game/scoring";
import { level02 } from "@/levels/level-02";

describe("scoring (PRD §10.8, TC-F11)", () => {
  it("matches the worked Level 2 example", () => {
    expect(scoreLevel({ parTimeSec: 90, parMoves: 5, timeSec: 130, moves: 9, hintsUsed: 1 })).toEqual({
      timePenalty: 80,
      movePenalty: 60,
      hintPenalty: 100,
      score: 760,
      stars: 2,
    });
  });

  it("uses the exact star thresholds at 499, 500, 799 and 800", () => {
    // Time penalties are continuous, so they can offset the fixed 100-point hint steps.
    const at = (score: number, hintsUsed: number) =>
      scoreLevel({
        parTimeSec: 0,
        parMoves: 0,
        timeSec: (1000 - hintsUsed * 100 - score) / 2,
        moves: 0,
        hintsUsed,
      }).score;
    expect(at(499, 3)).toBe(499);
    expect(starsForScore(499)).toBe(1);
    expect(at(500, 3)).toBe(500);
    expect(starsForScore(500)).toBe(2);
    expect(at(799, 2)).toBe(799);
    expect(starsForScore(799)).toBe(2);
    expect(at(800, 2)).toBe(800);
    expect(starsForScore(800)).toBe(3);
  });

  it("caps each effort penalty and never drops below the floor", () => {
    const result = scoreLevel({ parTimeSec: 0, parMoves: 0, timeSec: 1000, moves: 1000, hintsUsed: 10 });
    expect(result.timePenalty).toBe(gameConfig.scoring.penaltyCap);
    expect(result.movePenalty).toBe(gameConfig.scoring.penaltyCap);
    expect(result.hintPenalty).toBe(10 * gameConfig.scoring.hintPenalty);
    expect(result.score).toBe(gameConfig.scoring.minScore);
    expect(result.stars).toBe(1);
  });

  it("reads par values from the level and builds a stable saved record", () => {
    const attempt = { timeSec: 90, moves: 5, hintsUsed: 0 };
    expect(scoreFromLevel(level02, attempt).score).toBe(1000);
    expect(buildScoreRecord(level02, { parTimeSec: 90, parMoves: 5, ...attempt }, "fixed-time")).toEqual({
      levelId: "level-02",
      score: 1000,
      stars: 3,
      timeSec: 90,
      moves: 5,
      hintsUsed: 0,
      at: "fixed-time",
    });
  });
});
