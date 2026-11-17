/*
 * Fixed-size object pool with a LIFO free list: every slot is allocated once in the constructor,
 * so spawning and recycling during play never allocates. Callers use the returned numeric index
 * as a handle; release pushes it back onto the free list and forEachActive skips dead slots.
 */
export class Pool<T> {
  private readonly values: T[];
  private readonly free: number[] = [];
  private readonly live: boolean[];
  private activeCount = 0;

  constructor(capacity: number, factory: (index: number) => T) {
    const size = Math.max(0, Math.floor(Number.isFinite(capacity) ? capacity : 0));
    this.values = Array.from({ length: size }, (_, index) => factory(index));
    this.live = new Array<boolean>(size).fill(false);
    for (let index = size - 1; index >= 0; index -= 1) this.free.push(index);
  }

  get capacity(): number {
    return this.values.length;
  }

  get active(): number {
    return this.activeCount;
  }

  get available(): number {
    return this.free.length;
  }

  /** Returns -1 when the pool is exhausted; the caller decides what low-priority slot to drop. */
  acquire(): number {
    const index = this.free.pop();
    if (index === undefined) return -1;
    this.live[index] = true;
    this.activeCount += 1;
    return index;
  }

  release(index: number): void {
    if (index < 0 || index >= this.values.length || !this.live[index]) return;
    this.live[index] = false;
    this.activeCount -= 1;
    this.free.push(index);
  }

  valueAt(index: number): T {
    return this.values[index];
  }

  isLive(index: number): boolean {
    return index >= 0 && index < this.values.length && this.live[index];
  }

  forEachActive(callback: (value: T, index: number) => void): void {
    for (let index = 0; index < this.values.length; index += 1) {
      if (this.live[index]) callback(this.values[index], index);
    }
  }

  clear(): void {
    for (let index = 0; index < this.values.length; index += 1) {
      this.live[index] = false;
      this.free[index] = this.values.length - 1 - index;
    }
    this.activeCount = 0;
  }
}
