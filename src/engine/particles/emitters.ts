/*
 * Turns solver and game-system changes into particles (PRD §12.6): sparks at lit surfaces, ripples
 * near boats and rocks, one burst plus shock ring per target activation, and gate dust while a gate
 * slides. Previous-frame state lives in reused sets/maps and all scans are index-based, so steady
 * frames allocate nothing.
 */
import { gameConfig } from "@/config/gameConfig";
import { visualConfig } from "@/config/visualConfig";
import type { QualityPresetValues } from "@/config/gameConfig";
import type { GameState } from "@/engine/core/GameState";
import type { Palette } from "@/engine/render/palette";
import type { RGB } from "@/types/color";
import type { ParticlePool } from "./ParticlePool";

const { particles } = visualConfig;
const SPARK_TYPES = new Set(["mirror", "obstacle", "gate"]);

export interface EmitterSettings {
  quality: QualityPresetValues;
  reducedMotion: boolean;
  palette: Palette;
  colorFor(color: RGB): string;
}

const CHANNELS: Record<string, RGB> = {
  red: { r: 1, g: 0, b: 0 },
  green: { r: 0, g: 1, b: 0 },
  blue: { r: 0, g: 0, b: 1 },
  any: { r: 1, g: 1, b: 1 },
};

export class ParticleEmitter {
  private readonly sparks = new Map<string, number>();
  private readonly prevActive = new Set<string>();
  private readonly prevGate = new Map<string, number>();
  private moteAccum = 0;
  private rippleAccum = 0;
  private rippleIndex = 0;

  constructor(private readonly random: () => number = Math.random) {}

  update(dt: number, state: GameState, pool: ParticlePool, settings: EmitterSettings): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const rate = settings.reducedMotion ? particles.reducedMotionFactor : 1;
    this.emitMotes(dt, state, pool, settings, rate);
    this.emitSparks(dt, state, pool, settings, rate);
    this.emitRipples(dt, state, pool, settings, rate);
    this.emitBursts(state, pool, settings, rate);
    this.emitGateDust(state, pool, settings, rate);
    this.remember(state);
  }

  private emitMotes(
    dt: number,
    state: GameState,
    pool: ParticlePool,
    settings: EmitterSettings,
    rate: number,
  ): void {
    if (pool.motes >= settings.quality.moteCap) return;
    this.moteAccum += dt * (settings.quality.moteCap / particles.moteRateDivisor) * rate;
    const { boundary } = gameConfig;
    while (this.moteAccum >= 1 && pool.motes < settings.quality.moteCap) {
      this.moteAccum -= 1;
      pool.spawnMote(
        boundary.x0 + this.random() * (boundary.x1 - boundary.x0),
        boundary.y0 + this.random() * (boundary.y1 - boundary.y0),
        state.level.darkness ? settings.palette.mist : settings.palette.cyanBeam,
      );
    }
  }

  private emitSparks(
    dt: number,
    state: GameState,
    pool: ParticlePool,
    settings: EmitterSettings,
    rate: number,
  ): void {
    const events = state.result.events;
    let emitting = 0;
    for (let index = 0; index < events.length && emitting < particles.maxSparkEmitters; index += 1) {
      const event = events[index];
      if (!SPARK_TYPES.has(event.type) || event.intensity <= 0) continue;
      emitting += 1;
      const key = `${event.objectId}:${event.bounce}`;
      const accumulated = (this.sparks.get(key) ?? 0) + dt * particles.sparkRate * rate;
      let count = Math.floor(accumulated);
      this.sparks.set(key, accumulated - count);
      const color = settings.colorFor(event.color);
      const normal = event.normal;
      const base = normal ? Math.atan2(normal.y, normal.x) * 180 / Math.PI : this.random() * 360;
      while (count > 0) {
        count -= 1;
        pool.spawnSpark(event.point.x, event.point.y, color, base + (this.random() * 2 - 1) * 35);
      }
    }
  }

  private emitRipples(
    dt: number,
    state: GameState,
    pool: ParticlePool,
    settings: EmitterSettings,
    rate: number,
  ): void {
    const targets = state.targets;
    const obstacles = state.movableObstacles;
    const total = targets.length + obstacles.length;
    if (total === 0) return;
    this.rippleAccum += dt * particles.rippleRate * rate;
    while (this.rippleAccum >= 1) {
      this.rippleAccum -= 1;
      const index = this.rippleIndex % total;
      this.rippleIndex += 1;
      const anchor = index < targets.length ? targets[index] : obstacles[index - targets.length];
      const center = "center" in anchor ? anchor.center : anchor.position;
      const radius = "radius" in anchor ? anchor.radius : 14;
      pool.spawnRipple(center.x, center.y + radius, settings.palette.oceanTeal);
    }
  }

  private emitBursts(state: GameState, pool: ParticlePool, settings: EmitterSettings, rate: number): void {
    for (const target of state.targets) {
      if (!target.active || this.prevActive.has(target.id)) continue;
      const color = settings.colorFor(CHANNELS[target.requires] ?? CHANNELS.any);
      const count = Math.max(1, Math.round(particles.burstCount * rate));
      for (let index = 0; index < count; index += 1) {
        pool.spawnBurst(target.center.x, target.center.y, color, this.random() * 360);
      }
      pool.spawnShock(target.center.x, target.center.y, color);
    }
  }

  private emitGateDust(
    state: GameState,
    pool: ParticlePool,
    settings: EmitterSettings,
    rate: number,
  ): void {
    for (const gate of state.gates) {
      const previous = this.prevGate.get(gate.id) ?? 0;
      if (Math.abs(gate.openFraction - previous) === 0) continue;
      const count = Math.max(1, Math.round(particles.gateDustCount * rate));
      for (let index = 0; index < count; index += 1) {
        pool.spawnDust(
          (gate.a.x + gate.b.x) / 2 + (this.random() * 2 - 1) * 12,
          (gate.a.y + gate.b.y) / 2 + (this.random() * 2 - 1) * 12,
          settings.palette.mist,
        );
      }
    }
  }

  private remember(state: GameState): void {
    this.prevActive.clear();
    for (const target of state.targets) if (target.active) this.prevActive.add(target.id);
    this.prevGate.clear();
    for (const gate of state.gates) this.prevGate.set(gate.id, gate.openFraction);
  }
}
