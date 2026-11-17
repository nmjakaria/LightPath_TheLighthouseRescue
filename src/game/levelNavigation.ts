/* Pure navigation rules for the menu and play route. Unlock status is derived from progress every
 * time; an id is valid only when it exists in the level catalogue, so stale URLs cannot open a
 * half-built or unknown level. */
import { LEVEL_CATALOG } from "@/config/levelCatalog";
import { isLevelUnlocked, levelIdForIndex } from "@/stores/progressStore";
import type { PlayerProgress } from "@/types/progress";

const LEVEL_ID_PATTERN = /^level-(\d{2})$/;

/** Returns the 1-based level index for a URL id, or null when the id is unknown. */
export function parseLevelId(raw: string | undefined): number | null {
  const match = typeof raw === "string" ? LEVEL_ID_PATTERN.exec(raw) : null;
  if (!match) return null;
  const index = Number(match[1]);
  return LEVEL_CATALOG.some((level) => level.index === index) ? index : null;
}

export function levelRoute(index: number): string {
  return `/play/${levelIdForIndex(index)}`;
}

export function isLevelComplete(progress: PlayerProgress, index: number): boolean {
  return progress.levels[levelIdForIndex(index)]?.completed === true;
}

export function hasProgress(progress: PlayerProgress): boolean {
  return Object.values(progress.levels).some(
    (record) => record.completed || record.best !== null || record.attempts > 0,
  );
}

/** First unfinished unlocked level; when all are complete, the last level is offered for replay. */
export function firstPlayableLevel(progress: PlayerProgress, demoUnlockAll: boolean): number {
  const next = LEVEL_CATALOG.find(
    (level) =>
      isLevelUnlocked(progress, level.index, demoUnlockAll) && !isLevelComplete(progress, level.index),
  );
  if (next) return next.index;

  const replay = [...LEVEL_CATALOG]
    .reverse()
    .find((level) => isLevelUnlocked(progress, level.index, demoUnlockAll));
  return replay?.index ?? LEVEL_CATALOG[0].index;
}

export function lockedLevelMessage(index: number): string {
  return index > 1 ? `Complete Level ${index - 1} first` : "This level is locked";
}
