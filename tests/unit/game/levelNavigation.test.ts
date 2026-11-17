import { describe, expect, it } from "vitest";
import { LEVEL_CATALOG } from "@/config/levelCatalog";
import {
  firstPlayableLevel,
  hasProgress,
  isLevelComplete,
  levelRoute,
  lockedLevelMessage,
  parseLevelId,
} from "@/game/levelNavigation";
import { defaultProgress, recordAttempt, recordCompletion } from "@/stores/progressStore";
import type { ScoreRecord } from "@/types/progress";

function completion(levelId: string): ScoreRecord {
  return { levelId, score: 900, stars: 3, timeSec: 40, moves: 3, hintsUsed: 0, at: "2026-01-01T00:00:00Z" };
}

describe("level route parsing", () => {
  it("accepts only known zero-padded level ids", () => {
    expect(parseLevelId("level-01")).toBe(1);
    expect(parseLevelId("level-05")).toBe(5);
    expect(parseLevelId("level-1")).toBeNull();
    expect(parseLevelId("level-06")).toBeNull();
    expect(parseLevelId("../levels")).toBeNull();
    expect(parseLevelId(undefined)).toBeNull();
  });

  it("builds the canonical route for an index", () => {
    expect(levelRoute(3)).toBe("/play/level-03");
  });
});

describe("campaign progress", () => {
  it("starts at level 1 with no save", () => {
    const progress = defaultProgress();
    expect(hasProgress(progress)).toBe(false);
    expect(firstPlayableLevel(progress, false)).toBe(1);
    expect(isLevelComplete(progress, 1)).toBe(false);
  });

  it("offers the first unfinished unlocked level", () => {
    let progress = defaultProgress();
    progress = recordCompletion(progress, completion("level-01"));
    expect(hasProgress(progress)).toBe(true);
    expect(firstPlayableLevel(progress, false)).toBe(2);

    progress = recordCompletion(progress, completion("level-02"));
    expect(firstPlayableLevel(progress, false)).toBe(3);
  });

  it("honours demo unlock and offers the last level for replay after completion", () => {
    const progress = defaultProgress();
    expect(firstPlayableLevel(progress, true)).toBe(1);

    const completedAll = LEVEL_CATALOG.reduce(
      (current, level) => recordCompletion(current, completion(level.id)),
      defaultProgress(),
    );
    expect(firstPlayableLevel(completedAll, false)).toBe(5);
  });

  it("counts attempts as progress even without a completion", () => {
    const progress = recordAttempt(defaultProgress(), "level-01");
    expect(hasProgress(progress)).toBe(true);
    expect(firstPlayableLevel(progress, false)).toBe(1);
  });
});

describe("locked feedback", () => {
  it("names the prerequisite level", () => {
    expect(lockedLevelMessage(2)).toBe("Complete Level 1 first");
    expect(lockedLevelMessage(5)).toBe("Complete Level 4 first");
    expect(lockedLevelMessage(1)).toBe("This level is locked");
  });
});
