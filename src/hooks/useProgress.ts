"use client";

/* Progress reads are derived here: unlock checks combine the saved records with the demo flag,
 * and every mutation goes through the persistent store's immutable update helpers. */
import { useCallback } from "react";
import type { PlayerProgress, ScoreRecord } from "@/types/progress";
import {
  isLevelUnlocked as deriveUnlock,
  markTutorialSeen as markSeen,
  progressStore,
  recordAttempt as addAttempt,
  recordCompletion as saveCompletion,
  SERVER_PROGRESS,
} from "@/stores/progressStore";
import { SERVER_SETTINGS, settingsStore } from "@/stores/settingsStore";
import { useStore } from "./useStore";

const resetProgress = (): void => progressStore.reset();
const getIsPersistent = (): boolean => progressStore.isPersistent();

export interface UseProgressResult {
  progress: PlayerProgress;
  isLevelUnlocked: (levelIndex: number) => boolean;
  recordCompletion: (record: ScoreRecord) => void;
  recordAttempt: (levelId: string) => void;
  markTutorialSeen: (tutorialId: string) => void;
  resetProgress: () => void;
  isPersistent: boolean;
}

export function useProgress(): UseProgressResult {
  const progress = useStore(progressStore, () => SERVER_PROGRESS);
  const settings = useStore(settingsStore, () => SERVER_SETTINGS);

  return {
    progress,
    isLevelUnlocked: useCallback(
      (levelIndex: number) => deriveUnlock(progress, levelIndex, settings.demoUnlockAll),
      [progress, settings.demoUnlockAll],
    ),
    recordCompletion: useCallback((record: ScoreRecord) => {
      progressStore.set((previous) => saveCompletion(previous, record));
    }, []),
    recordAttempt: useCallback((levelId: string) => {
      progressStore.set((previous) => addAttempt(previous, levelId));
    }, []),
    markTutorialSeen: useCallback((tutorialId: string) => {
      progressStore.set((previous) => markSeen(previous, tutorialId));
    }, []),
    resetProgress,
    isPersistent: getIsPersistent(),
  };
}
