/*
 * Scoring from PRD §10.8. Every penalty is capped independently, hints cost a fixed amount, and
 * a completed level can never fall below one star. Keeping the arithmetic pure makes TC-F11 and
 * the completion screen read from exactly the same source.
 */
import { gameConfig } from "@/config/gameConfig";
import type { LevelConfig } from "@/types/level";
import type { ScoreRecord, Stars } from "@/types/progress";

export interface ScoreInput {
  parTimeSec: number;
  parMoves: number;
  timeSec: number;
  moves: number;
  hintsUsed: number;
}

export interface ScoreResult {
  timePenalty: number;
  movePenalty: number;
  hintPenalty: number;
  score: number;
  stars: Stars;
}

function positive(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function starsForScore(score: number): Stars {
  const { three, two } = gameConfig.scoring.stars;
  return score >= three ? 3 : score >= two ? 2 : 1;
}

/** TC-F11: deterministic, saturating penalties followed by the fixed minimum score. */
export function scoreLevel(input: ScoreInput): ScoreResult {
  const { scoring } = gameConfig;
  const timePenalty = Math.min(
    scoring.penaltyCap,
    scoring.timePenaltyPerSec * positive(input.timeSec - input.parTimeSec),
  );
  const movePenalty = Math.min(
    scoring.penaltyCap,
    scoring.movePenalty * positive(input.moves - input.parMoves),
  );
  const hintPenalty = scoring.hintPenalty * positive(input.hintsUsed);
  const score = Math.max(scoring.minScore, scoring.base - timePenalty - movePenalty - hintPenalty);
  return { timePenalty, movePenalty, hintPenalty, score, stars: starsForScore(score) };
}

export function scoreFromLevel(
  level: Pick<LevelConfig, "par">,
  attempt: Pick<ScoreInput, "timeSec" | "moves" | "hintsUsed">,
): ScoreResult {
  return scoreLevel({ parTimeSec: level.par.timeSec, parMoves: level.par.moves, ...attempt });
}

/** Builds the saved record; the caller supplies the timestamp so tests stay deterministic. */
export function buildScoreRecord(
  level: Pick<LevelConfig, "id">,
  attempt: ScoreInput,
  at: string = new Date().toISOString(),
): ScoreRecord {
  const { score, stars } = scoreLevel(attempt);
  return {
    levelId: level.id,
    score,
    stars,
    timeSec: attempt.timeSec,
    moves: attempt.moves,
    hintsUsed: attempt.hintsUsed,
    at,
  };
}
