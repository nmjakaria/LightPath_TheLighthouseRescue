/*
 * requestAnimationFrame loop with a clamped variable time step. The clamp prevents a large jump
 * after a tab stall; suspending on tab hide cancels the frame and clears the last timestamp so
 * resuming starts with dt = 0. One mutable stats object is reused to avoid per-frame allocation.
 */
import { gameConfig } from "@/config/gameConfig";

export type FrameCallback = (timestamp: number) => void;

export interface FrameScheduler {
  request(callback: FrameCallback): number;
  cancel(handle: number): void;
}

export const animationFrameScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
};

export interface FrameStats {
  elapsedSec: number;
  dt: number;
  frameMs: number;
  fps: number;
  frames: number;
}

export interface GameLoopCallbacks {
  processInput(): void;
  update(dt: number): void;
  render(stats: Readonly<FrameStats>): void;
  isPaused?(): boolean;
}

export class GameLoop {
  private handle: number | null = null;
  private started = false;
  private suspended = false;
  private lastTime: number | null = null;
  private lastRawMs: number | null = null;

  readonly stats: FrameStats = { elapsedSec: 0, dt: 0, frameMs: 0, fps: 0, frames: 0 };

  constructor(
    private readonly callbacks: GameLoopCallbacks,
    private readonly scheduler: FrameScheduler = animationFrameScheduler,
    private readonly dtClamp: number = gameConfig.dtClamp,
    private readonly smoothing: number = gameConfig.render.fpsSmoothing,
  ) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    if (!this.suspended) this.schedule();
  }

  stop(): void {
    this.started = false;
    this.cancelFrame();
    this.lastTime = null;
    this.lastRawMs = null;
  }

  suspend(): void {
    if (this.suspended) return;
    this.suspended = true;
    this.cancelFrame();
    this.lastTime = null;
    this.lastRawMs = null;
  }

  resume(): void {
    if (!this.suspended) return;
    this.suspended = false;
    if (this.started) this.schedule();
  }

  isRunning(): boolean {
    return this.started && !this.suspended;
  }

  /** Executes one logical frame. Public so tests can drive time without a real browser. */
  frame(now: number): void {
    if (!this.isRunning()) return;
    const dt = this.computeDt(now);
    this.updateStats(now, dt);

    this.callbacks.processInput();
    if (this.callbacks.isPaused?.() !== true) this.callbacks.update(dt);
    this.callbacks.render(this.stats);
  }

  private computeDt(now: number): number {
    if (this.lastTime === null || !Number.isFinite(now)) {
      this.lastTime = Number.isFinite(now) ? now : null;
      return 0;
    }
    const raw = Math.max(0, (now - this.lastTime) / 1000);
    this.lastTime = now;
    return Math.min(this.dtClamp, raw);
  }

  private updateStats(now: number, dt: number): void {
    const hadSample = this.lastRawMs !== null;
    const rawMs = hadSample ? Math.max(0, now - (this.lastRawMs as number)) : 0;
    this.lastRawMs = now;
    if (rawMs > 0) {
      // Seed from the first real interval; otherwise the first reading would be 10x too fast.
      this.stats.frameMs =
        this.stats.frameMs === 0
          ? rawMs
          : this.stats.frameMs * (1 - this.smoothing) + rawMs * this.smoothing;
      this.stats.fps = 1000 / this.stats.frameMs;
    }
    this.stats.dt = dt;
    this.stats.elapsedSec += dt;
    this.stats.frames += 1;
  }

  private schedule(): void {
    if (this.handle !== null) return;
    this.handle = this.scheduler.request((now) => {
      this.handle = null;
      this.frame(now);
      if (this.isRunning()) this.schedule();
    });
  }

  private cancelFrame(): void {
    if (this.handle === null) return;
    this.scheduler.cancel(this.handle);
    this.handle = null;
  }
}
