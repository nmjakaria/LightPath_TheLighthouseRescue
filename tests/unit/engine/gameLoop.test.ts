import { describe, expect, it } from "vitest";
import {
  GameLoop,
  type FrameCallback,
  type FrameScheduler,
  type GameLoopCallbacks,
} from "@/engine/core/GameLoop";

/** Minimal RAF stand-in: frames are delivered only when the test flushes a timestamp. */
class FakeScheduler implements FrameScheduler {
  private readonly callbacks = new Map<number, FrameCallback>();
  private nextId = 1;
  requested = 0;
  cancelled = 0;
  executed = 0;

  request(callback: FrameCallback): number {
    const id = this.nextId;
    this.nextId += 1;
    this.callbacks.set(id, callback);
    this.requested += 1;
    return id;
  }

  cancel(handle: number): void {
    if (this.callbacks.delete(handle)) this.cancelled += 1;
  }

  flush(now: number): void {
    const pending = [...this.callbacks.entries()];
    this.callbacks.clear();
    for (const [, callback] of pending) {
      this.executed += 1;
      callback(now);
    }
  }

  get pending(): number {
    return this.callbacks.size;
  }
}

function makeLoop(
  overrides: Partial<GameLoopCallbacks> = {},
): { loop: GameLoop; scheduler: FakeScheduler; calls: { input: number; update: number[]; render: number } } {
  const scheduler = new FakeScheduler();
  const calls = { input: 0, update: [] as number[], render: 0 };
  const loop = new GameLoop(
    {
      processInput: () => {
        calls.input += 1;
      },
      update: (dt) => {
        calls.update.push(dt);
      },
      render: () => {
        calls.render += 1;
      },
      ...overrides,
    },
    scheduler,
  );
  return { loop, scheduler, calls };
}

describe("GameLoop", () => {
  it("starts the first frame with dt = 0 and clamps long stalls to DT_CLAMP", () => {
    const { loop, scheduler, calls } = makeLoop();
    loop.start();
    expect(scheduler.pending).toBe(1);

    scheduler.flush(1000);
    expect(calls.update[0]).toBe(0);
    expect(loop.stats.frames).toBe(1);

    scheduler.flush(1016);
    expect(calls.update[1]).toBeCloseTo(0.016, 9);
    scheduler.flush(2000);
    expect(calls.update[2]).toBe(0.05);
    expect(loop.stats.elapsedSec).toBeCloseTo(0.066, 9);
  });

  it("cancels the pending frame on suspend and resets dt after resume", () => {
    const { loop, scheduler, calls } = makeLoop();
    loop.start();
    scheduler.flush(0);
    loop.suspend();

    expect(scheduler.pending).toBe(0);
    expect(scheduler.cancelled).toBe(1);
    expect(loop.isRunning()).toBe(false);
    scheduler.flush(5000);
    expect(calls.update).toHaveLength(1);

    loop.resume();
    expect(scheduler.pending).toBe(1);
    scheduler.flush(9000);
    expect(calls.update[1]).toBe(0);
  });

  it("stop cancels the loop and later frames are ignored", () => {
    const { loop, scheduler, calls } = makeLoop();
    loop.start();
    loop.stop();
    expect(scheduler.pending).toBe(0);
    expect(loop.isRunning()).toBe(false);
    loop.frame(10);
    scheduler.flush(10);
    expect(calls.update).toHaveLength(0);
    expect(calls.render).toBe(0);
  });

  it("still processes input and renders while paused but skips update", () => {
    const { loop, scheduler, calls } = makeLoop({ isPaused: () => true });
    loop.start();
    scheduler.flush(0);
    scheduler.flush(16);
    expect(calls.input).toBe(2);
    expect(calls.update).toHaveLength(0);
    expect(calls.render).toBe(2);
  });

  it("reports a smoothed frame time and fps once real samples arrive", () => {
    const { loop, scheduler } = makeLoop();
    loop.start();
    for (let now = 0; now <= 600; now += 10) scheduler.flush(now);

    expect(loop.stats.frames).toBe(61);
    expect(loop.stats.frameMs).toBeCloseTo(10, 6);
    expect(loop.stats.fps).toBeCloseTo(100, 4);
    expect(loop.stats.elapsedSec).toBeCloseTo(0.6, 9);
  });

  it("treats a non-finite timestamp as a restart instead of writing NaN", () => {
    const { loop, scheduler, calls } = makeLoop();
    loop.start();
    scheduler.flush(0);
    scheduler.flush(16);
    scheduler.flush(Number.NaN);
    expect(calls.update[2]).toBe(0);
    expect(Number.isNaN(loop.stats.elapsedSec)).toBe(false);
    expect(Number.isNaN(loop.stats.frameMs)).toBe(false);
  });

  it("leaves no orphan frame requests across 20 mount/unmount cycles", () => {
    const scheduler = new FakeScheduler();
    const loop = new GameLoop(
      { processInput: () => {}, update: () => {}, render: () => {} },
      scheduler,
    );
    for (let cycle = 0; cycle < 20; cycle += 1) {
      loop.start();
      scheduler.flush(cycle * 16);
      loop.stop();
      expect(scheduler.pending).toBe(0);
    }
    expect(scheduler.requested).toBe(40);
    expect(scheduler.executed + scheduler.cancelled).toBe(scheduler.requested);
    expect(loop.stats.frames).toBe(20);
  });

  it("is idempotent for start, suspend and resume", () => {
    const { loop, scheduler } = makeLoop();
    loop.resume();
    expect(scheduler.requested).toBe(0);
    loop.suspend();
    loop.start();
    loop.start();
    expect(scheduler.requested).toBe(0);
    loop.resume();
    loop.resume();
    expect(scheduler.requested).toBe(1);
  });
});
