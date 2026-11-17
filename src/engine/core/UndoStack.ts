/*
 * Bounded LIFO stack of immutable snapshots. The oldest entry is discarded once the configured
 * limit is reached, so holding a key down can never grow memory without bound (PRD FR-024).
 */
import { gameConfig } from "@/config/gameConfig";

export class UndoStack<T> {
  private readonly items: T[] = [];

  constructor(private readonly limit: number = gameConfig.interaction.undoLimit) {}

  push(snapshot: T): void {
    this.items.push(snapshot);
    if (this.items.length > this.limit) this.items.shift();
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  clear(): void {
    this.items.length = 0;
  }

  get size(): number {
    return this.items.length;
  }
}
