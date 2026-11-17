/*
 * Completion finalization (PRD FR-013/FR-036): targets charge and hold in GameState; this module
 * turns that finished attempt into the immutable score and the record saved to progress. It has no
 * engine or React dependency, so the same calculation can be tested in isolation.
 */
import type { LevelConfig, TargetRuntime } from "@/types/level";
import type { ScoreRecord } from "@/types/progress";
import { buildScoreRecord, scoreLevel, type ScoreInput, type ScoreResult } from "./scoring";

export interface CompletionSummary {
  result: ScoreResult;
  record: ScoreRecord;
}

export function requiredTargetsActive(targets: readonly TargetRuntime[]): boolean {
  const required = targets.filter((target) => target.required);
  return required.length > 0 && required.every((target) => target.active);
}

export function createCompletion(
  level: LevelConfig,
  attempt: ScoreInput,
  at: string = new Date().toISOString(),
): CompletionSummary {
  return {
    result: scoreLevel(attempt),
    record: buildScoreRecord(level, attempt, at),
  };
}
