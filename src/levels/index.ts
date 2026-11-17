// Ordered level registry shared by menus, route gating and solution-replay tests (PRD §13).
import { level01 } from "./level-01";
import { level02 } from "./level-02";
import { level03 } from "./level-03";
import { level04 } from "./level-04";
import { level05 } from "./level-05";
import type { LevelConfig } from "@/types/level";

export const LEVELS: readonly LevelConfig[] = [level01, level02, level03, level04, level05] as const;

export function getLevelById(id: string): LevelConfig | undefined {
  return LEVELS.find((level) => level.id === id);
}

export function getLevelByIndex(index: number): LevelConfig | undefined {
  return LEVELS.find((level) => level.index === index);
}
