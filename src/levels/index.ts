// Ordered level registry. Only Level 1 is implemented in STEP 8; later levels are added in STEP 10.
import { level01 } from "./level-01";
import type { LevelConfig } from "@/types/level";

export const LEVELS: readonly LevelConfig[] = [level01] as const;

export function getLevelById(id: string): LevelConfig | undefined {
  return LEVELS.find((level) => level.id === id);
}

export function getLevelByIndex(index: number): LevelConfig | undefined {
  return LEVELS.find((level) => level.index === index);
}
