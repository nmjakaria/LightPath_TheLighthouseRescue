/*
 * Player progress: one record per level plus seen-tutorial flags. Unlock state is derived from
 * completion records (and the demo flag), never stored. Only strictly better results replace an
 * existing best; best time and best moves are tracked independently of best score (PRD §19).
 */
import { gameConfig, SCHEMA_VERSIONS, STORAGE_KEYS } from "@/config/gameConfig";
import { createPersistentStore } from "@/lib/store/createPersistentStore";
import type { LevelRecord, PlayerProgress, ScoreRecord, Stars } from "@/types/progress";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function finitePositiveOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function clampStars(value: unknown): Stars {
  return value === 3 ? 3 : value === 2 ? 2 : 1;
}

export function defaultProgress(): PlayerProgress {
  return { schemaVersion: 1, levels: {}, tutorialsSeen: {} };
}

function emptyLevelRecord(): LevelRecord {
  return { completed: false, best: null, bestTimeSec: null, bestMoves: null, attempts: 0 };
}

function parseScoreRecord(raw: Record<string, unknown>): ScoreRecord | null {
  if (typeof raw.levelId !== "string" || typeof raw.score !== "number" || !Number.isFinite(raw.score)) {
    return null;
  }
  return {
    levelId: raw.levelId,
    score: raw.score,
    stars: clampStars(raw.stars),
    timeSec: finiteNumber(raw.timeSec, 0),
    moves: finiteNumber(raw.moves, 0),
    hintsUsed: finiteNumber(raw.hintsUsed, 0),
    at: typeof raw.at === "string" ? raw.at : new Date(0).toISOString(),
  };
}

/** Repairs one level record; an unparseable entry is discarded rather than poisoning the whole save. */
function parseLevelRecord(raw: unknown): LevelRecord | null {
  if (!isRecord(raw)) return null;
  const best = isRecord(raw.best) ? parseScoreRecord(raw.best) : null;
  return {
    completed: raw.completed === true || best !== null,
    best,
    bestTimeSec: finitePositiveOrNull(raw.bestTimeSec),
    bestMoves: finitePositiveOrNull(raw.bestMoves),
    attempts: Math.max(0, Math.floor(finiteNumber(raw.attempts, 0))),
  };
}

export function parseProgress(raw: unknown): PlayerProgress {
  const input = isRecord(raw) ? raw : {};
  const sourceLevels = isRecord(input.levels) ? input.levels : {};
  const levels: Record<string, LevelRecord> = {};
  for (const [levelId, value] of Object.entries(sourceLevels)) {
    const parsed = parseLevelRecord(value);
    if (parsed) levels[levelId] = parsed;
  }

  const sourceTutorials = isRecord(input.tutorialsSeen) ? input.tutorialsSeen : {};
  const tutorialsSeen: Record<string, boolean> = {};
  for (const [tutorialId, value] of Object.entries(sourceTutorials)) {
    if (typeof value === "boolean") tutorialsSeen[tutorialId] = value;
  }
  return { schemaVersion: 1, levels, tutorialsSeen };
}

/**
 * Assumption: v0 saves had no schemaVersion and stored `bestScore`, `bestTimeSec` and `bestMoves`
 * directly on each level entry. They are folded into the v1 `best` record with zero hints.
 */
export function migrateProgressV0(raw: unknown): unknown {
  if (!isRecord(raw)) return defaultProgress();
  const sourceLevels = isRecord(raw.levels) ? raw.levels : {};
  const levels: Record<string, LevelRecord> = {};
  for (const [levelId, value] of Object.entries(sourceLevels)) {
    if (!isRecord(value)) continue;
    const score = finiteNumber(value.bestScore, 0);
    levels[levelId] = {
      completed: value.completed === true || score > 0,
      best:
        score > 0
          ? {
              levelId,
              score,
              stars: clampStars(value.stars),
              timeSec: finiteNumber(value.bestTimeSec, 0),
              moves: finiteNumber(value.bestMoves, 0),
              hintsUsed: 0,
              at: typeof value.at === "string" ? value.at : new Date(0).toISOString(),
            }
          : null,
      bestTimeSec: finitePositiveOrNull(value.bestTimeSec),
      bestMoves: finitePositiveOrNull(value.bestMoves),
      attempts: Math.max(0, Math.floor(finiteNumber(value.attempts, 0))),
    };
  }
  return parseProgress({ schemaVersion: 1, levels, tutorialsSeen: raw.tutorialsSeen });
}

/** Level ids are 1-based and zero-padded, e.g. index 1 → "level-01". */
export function levelIdForIndex(index: number): string {
  const safe = Number.isFinite(index) ? Math.max(1, Math.floor(index)) : 1;
  return `level-${String(safe).padStart(2, "0")}`;
}

/** Level 1 is always open; level n+1 opens when level n is completed or demo unlock is on. */
export function isLevelUnlocked(
  progress: PlayerProgress,
  levelIndex: number,
  demoUnlockAll: boolean,
): boolean {
  if (levelIndex <= 1) return true;
  if (demoUnlockAll) return true;
  const previous = progress.levels[levelIdForIndex(levelIndex - 1)];
  return previous?.completed === true;
}

/** Records a completion; only strictly better results replace the stored bests. */
export function recordCompletion(progress: PlayerProgress, record: ScoreRecord): PlayerProgress {
  const current = progress.levels[record.levelId] ?? emptyLevelRecord();
  const improvedScore = current.best === null || record.score > current.best.score;
  const bestTimeSec =
    current.bestTimeSec === null || record.timeSec < current.bestTimeSec
      ? record.timeSec
      : current.bestTimeSec;
  const bestMoves =
    current.bestMoves === null || record.moves < current.bestMoves ? record.moves : current.bestMoves;

  return {
    ...progress,
    levels: {
      ...progress.levels,
      [record.levelId]: {
        completed: true,
        best: improvedScore ? { ...record } : current.best,
        bestTimeSec,
        bestMoves,
        attempts: current.attempts,
      },
    },
  };
}

export function recordAttempt(progress: PlayerProgress, levelId: string): PlayerProgress {
  const current = progress.levels[levelId] ?? emptyLevelRecord();
  return {
    ...progress,
    levels: {
      ...progress.levels,
      [levelId]: { ...current, attempts: current.attempts + 1 },
    },
  };
}

export function markTutorialSeen(progress: PlayerProgress, tutorialId: string): PlayerProgress {
  return { ...progress, tutorialsSeen: { ...progress.tutorialsSeen, [tutorialId]: true } };
}

export const progressStore = createPersistentStore<PlayerProgress>({
  key: STORAGE_KEYS.progress,
  schemaVersion: SCHEMA_VERSIONS.progress,
  defaults: defaultProgress(),
  validate: parseProgress,
  migrate: (raw) => migrateProgressV0(raw),
  debounceMs: gameConfig.storage.writeDebounceMs,
});

/** Server snapshot constant; a fresh object per call is unnecessary because defaults are immutable in practice. */
export const SERVER_PROGRESS: PlayerProgress = defaultProgress();
