// Progress data models from PRD §19. Unlock state is derived, never stored.
export type Stars = 1 | 2 | 3;

export interface ScoreRecord {
  levelId: string;
  score: number;
  stars: Stars;
  timeSec: number;
  moves: number;
  hintsUsed: number;
  at: string;
}

export interface LevelRecord {
  completed: boolean;
  best: ScoreRecord | null;
  bestTimeSec: number | null;
  bestMoves: number | null;
  attempts: number;
}

export interface PlayerProgress {
  schemaVersion: 1;
  levels: Record<string, LevelRecord>;
  tutorialsSeen: Record<string, boolean>;
}
