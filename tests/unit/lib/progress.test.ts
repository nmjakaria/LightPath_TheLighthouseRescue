import { describe, expect, it } from "vitest";
import {
  defaultProgress,
  isLevelUnlocked,
  levelIdForIndex,
  markTutorialSeen,
  migrateProgressV0,
  parseProgress,
  recordAttempt,
  recordCompletion,
} from "@/stores/progressStore";
import type { ScoreRecord } from "@/types/progress";

function result(levelId: string, overrides: Partial<ScoreRecord> = {}): ScoreRecord {
  return {
    levelId,
    score: 800,
    stars: 3,
    timeSec: 30,
    moves: 5,
    hintsUsed: 0,
    at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("progress parsing", () => {
  it("starts empty and repairs corrupt fields without poisoning other levels", () => {
    expect(defaultProgress()).toEqual({ schemaVersion: 1, levels: {}, tutorialsSeen: {} });
    const parsed = parseProgress({
      levels: {
        "level-01": { completed: true, best: result("level-01"), attempts: -4 },
        "level-02": "broken",
      },
      tutorialsSeen: { start: true, rotate: "yes" },
    });
    expect(parsed.levels["level-01"].attempts).toBe(0);
    expect(parsed.levels["level-01"].completed).toBe(true);
    expect(parsed.levels["level-02"]).toBeUndefined();
    expect(parsed.tutorialsSeen).toEqual({ start: true });
    expect(parseProgress(42)).toEqual(defaultProgress());
  });

  it("migrates a fake v0 progress object", () => {
    const migrated = migrateProgressV0({
      levels: {
        "level-01": { completed: true, bestScore: 650, bestTimeSec: 42, bestMoves: 7, stars: 2, attempts: 3 },
        "level-02": { completed: false },
      },
      tutorialsSeen: { start: true },
    }) as ReturnType<typeof defaultProgress>;
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.levels["level-01"].best?.score).toBe(650);
    expect(migrated.levels["level-01"].best?.stars).toBe(2);
    expect(migrated.levels["level-01"].bestTimeSec).toBe(42);
    expect(migrated.levels["level-01"].attempts).toBe(3);
    expect(migrated.levels["level-02"].completed).toBe(false);
    expect(parseProgress(migrated)).toEqual(migrated);
  });
});

describe("unlock derivation (TC-F09 logic)", () => {
  it("opens level 1 always and level n+1 only when level n is complete", () => {
    let progress = defaultProgress();
    expect(isLevelUnlocked(progress, 1, false)).toBe(true);
    expect(isLevelUnlocked(progress, 2, false)).toBe(false);

    progress = recordCompletion(progress, result("level-01"));
    expect(isLevelUnlocked(progress, 2, false)).toBe(true);
    expect(isLevelUnlocked(progress, 3, false)).toBe(false);
  });

  it("opens every level when demo unlock is enabled and pads level ids", () => {
    expect(levelIdForIndex(1)).toBe("level-01");
    expect(levelIdForIndex(12)).toBe("level-12");
    expect(isLevelUnlocked(defaultProgress(), 9, true)).toBe(true);
  });
});

describe("best-result replay", () => {
  it("never overwrites the best score, but keeps independent best time and moves", () => {
    let progress = defaultProgress();
    progress = recordCompletion(progress, result("level-01", { score: 900, timeSec: 40, moves: 8 }));
    progress = recordCompletion(progress, result("level-01", { score: 700, timeSec: 20, moves: 3 }));

    const record = progress.levels["level-01"];
    expect(record.completed).toBe(true);
    expect(record.best?.score).toBe(900);
    expect(record.best?.timeSec).toBe(40);
    expect(record.bestTimeSec).toBe(20);
    expect(record.bestMoves).toBe(3);
  });

  it("replaces the best only when the new score is strictly higher", () => {
    let progress = recordCompletion(defaultProgress(), result("level-01", { score: 500, stars: 2 }));
    progress = recordCompletion(progress, result("level-01", { score: 500, stars: 3 }));
    expect(progress.levels["level-01"].best?.stars).toBe(2);

    progress = recordCompletion(progress, result("level-01", { score: 501, stars: 1 }));
    expect(progress.levels["level-01"].best?.score).toBe(501);
    expect(progress.levels["level-01"].best?.stars).toBe(1);
  });
});

describe("attempts and tutorials", () => {
  it("counts attempts and preserves the existing level record", () => {
    let progress = recordCompletion(defaultProgress(), result("level-01"));
    progress = recordAttempt(progress, "level-01");
    progress = recordAttempt(progress, "level-01");
    expect(progress.levels["level-01"].attempts).toBe(2);
    expect(progress.levels["level-01"].best?.score).toBe(800);
  });

  it("marks a tutorial as seen once", () => {
    const progress = markTutorialSeen(defaultProgress(), "firstRotate");
    expect(progress.tutorialsSeen.firstRotate).toBe(true);
    expect(defaultProgress().tutorialsSeen.firstRotate).toBeUndefined();
  });
});
