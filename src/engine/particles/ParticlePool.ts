/*
 * Pooled short-lived particles from PRD §12.6. Slots are created once; each frame applies linear
 * drag, explicit Euler motion and life decay, then the renderer draws two blend passes without a
 * save/restore per particle. Ambient motes are the first slots dropped when a quality cap is hit.
 */
import { gameConfig } from "@/config/gameConfig";
import { visualConfig } from "@/config/visualConfig";
import { clamp01, lerp } from "@/lib/math/easing";
import type { QualityPresetValues } from "@/config/gameConfig";
import type { GlowSpriteCache } from "@/engine/render/glowSprites";
import { Pool } from "./Pool";

export type ParticleKind = "mote" | "spark" | "ripple" | "burst" | "shock" | "dust";

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  drag: number;
  seed: number;
  wobble: number;
  radius: number;
  endRadius: number;
}

const { particles, effects } = visualConfig;

export class ParticlePool {
  private readonly pool: Pool<Particle>;
  private totalCap: number;
  private moteCap: number;
  private moteCount = 0;

  constructor(
    quality: QualityPresetValues,
    private readonly random: () => number = Math.random,
    capacity: number = gameConfig.quality.high.particleCap,
  ) {
    this.pool = new Pool(capacity, () => ({
      kind: "mote", x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 1,
      color: "", drag: 0, seed: 0, wobble: 0, radius: 0, endRadius: 0,
    }));
    this.totalCap = Math.min(capacity, quality.particleCap);
    this.moteCap = Math.min(this.totalCap, quality.moteCap);
  }

  get active(): number { return this.pool.active; }
  get motes(): number { return this.moteCount; }
  get capacity(): number { return this.pool.capacity; }

  setQuality(quality: QualityPresetValues): void {
    this.totalCap = Math.min(this.pool.capacity, quality.particleCap);
    this.moteCap = Math.min(this.totalCap, quality.moteCap);
    while (this.pool.active > this.totalCap && this.dropMote()) { /* drop ambient first */ }
    while (this.moteCount > this.moteCap && this.dropMote()) { /* then trim motes */ }
  }

  clear(): void {
    this.pool.clear();
    this.moteCount = 0;
  }

  private allocate(kind: ParticleKind): number {
    if (this.pool.active >= this.totalCap && !this.dropMote()) return -1;
    const index = this.pool.acquire();
    if (index < 0) return -1;
    const particle = this.pool.valueAt(index);
    particle.kind = kind;
    if (kind === "mote") this.moteCount += 1;
    return index;
  }

  private dropMote(): boolean {
    let found = false;
    this.pool.forEachActive((particle, index) => {
      if (!found && particle.kind === "mote") {
        this.pool.release(index);
        this.moteCount -= 1;
        found = true;
      }
    });
    return found;
  }

  private init(
    index: number,
    kind: ParticleKind,
    x: number,
    y: number,
    color: string,
    life: number,
    size: number,
  ): Particle {
    const particle = this.pool.valueAt(index);
    particle.kind = kind;
    particle.x = x;
    particle.y = y;
    particle.vx = 0;
    particle.vy = 0;
    particle.color = color;
    particle.life = life;
    particle.maxLife = life;
    particle.size = size;
    particle.drag = 0;
    particle.seed = this.random() * Math.PI * 2;
    particle.wobble = 0;
    particle.radius = 0;
    particle.endRadius = 0;
    return particle;
  }

  spawnMote(x: number, y: number, color: string): boolean {
    if (this.moteCount >= this.moteCap) return false;
    const index = this.allocate("mote");
    if (index < 0) return false;
    const particle = this.init(
      index, "mote", x, y, color,
      lerp(particles.moteLifeMin, particles.moteLifeMax, this.random()),
      lerp(particles.moteSizeMin, particles.moteSizeMax, this.random()),
    );
    particle.vx = (this.random() * 2 - 1) * particles.moteDrift;
    particle.vy = (this.random() * 2 - 1) * particles.moteDrift;
    particle.wobble = particles.moteDrift;
    return true;
  }

  spawnSpark(x: number, y: number, color: string, angleDeg: number): boolean {
    const index = this.allocate("spark");
    if (index < 0) return false;
    const angle = angleDeg * Math.PI / 180;
    const speed = lerp(particles.sparkSpeedMin, particles.sparkSpeedMax, this.random());
    const particle = this.init(
      index, "spark", x, y, color,
      lerp(particles.sparkLifeMin, particles.sparkLifeMax, this.random()), 1,
    );
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    particle.drag = particles.sparkDrag;
    return true;
  }

  spawnBurst(x: number, y: number, color: string, angleDeg: number): boolean {
    const index = this.allocate("burst");
    if (index < 0) return false;
    const angle = angleDeg * Math.PI / 180;
    const speed = lerp(particles.burstSpeedMin, particles.burstSpeedMax, this.random());
    const particle = this.init(
      index, "burst", x, y, color,
      lerp(particles.burstLifeMin, particles.burstLifeMax, this.random()), 2,
    );
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    particle.drag = particles.burstDrag;
    return true;
  }

  spawnRipple(x: number, y: number, color: string): boolean {
    const index = this.allocate("ripple");
    if (index < 0) return false;
    this.init(
      index, "ripple", x, y, color,
      lerp(particles.rippleLifeMin, particles.rippleLifeMax, this.random()), 1,
    );
    return true;
  }

  spawnShock(x: number, y: number, color: string): boolean {
    const index = this.allocate("shock");
    if (index < 0) return false;
    const particle = this.init(index, "shock", x, y, color, particles.shockLife, 1);
    particle.radius = particles.shockStartRadius;
    particle.endRadius = particles.shockEndRadius;
    return true;
  }

  spawnDust(x: number, y: number, color: string): boolean {
    const index = this.allocate("dust");
    if (index < 0) return false;
    const particle = this.init(index, "dust", x, y, color, particles.gateDustLife, 2);
    particle.vy = particles.moteDrift;
    return true;
  }

  update(dt: number, timeSec: number, reducedMotion: boolean): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const scale = reducedMotion ? particles.reducedMotionFactor : 1;
    const { boundary } = gameConfig;
    this.pool.forEachActive((particle, index) => {
      particle.life -= dt;
      if (particle.life <= 0) {
        if (particle.kind === "mote") this.moteCount -= 1;
        this.pool.release(index);
        return;
      }
      if (particle.kind === "mote") {
        particle.x += (particle.vx + Math.sin(timeSec + particle.seed) * particle.wobble) * dt * scale;
        particle.y += particle.vy * dt * scale;
        const margin = particles.wrapMargin;
        if (particle.x < boundary.x0 - margin) particle.x = boundary.x1 + margin;
        if (particle.x > boundary.x1 + margin) particle.x = boundary.x0 - margin;
        if (particle.y < boundary.y0 - margin) particle.y = boundary.y1 + margin;
        if (particle.y > boundary.y1 + margin) particle.y = boundary.y0 - margin;
      } else if (particle.kind === "spark" || particle.kind === "burst" || particle.kind === "dust") {
        const drag = Math.max(0, 1 - particle.drag * dt);
        particle.vx *= drag;
        particle.vy *= drag;
        particle.x += particle.vx * dt * scale;
        particle.y += particle.vy * dt * scale;
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D, sprites: GlowSpriteCache): void {
    this.drawPass(ctx, sprites, false);
    ctx.globalCompositeOperation = "lighter";
    this.drawPass(ctx, sprites, true);
    ctx.globalCompositeOperation = "source-over";
  }

  private drawPass(ctx: CanvasRenderingContext2D, sprites: GlowSpriteCache, additive: boolean): void {
    this.pool.forEachActive((particle) => {
      if ((particle.kind === "spark" || particle.kind === "burst" || particle.kind === "shock") !== additive) {
        return;
      }
      const remaining = clamp01(particle.life / particle.maxLife);
      ctx.globalAlpha = remaining * remaining;
      if (particle.kind === "ripple" || particle.kind === "shock") {
        const radius = particle.kind === "shock"
          ? lerp(particle.endRadius, particle.radius, remaining)
          : particles.shockStartRadius * (2 - remaining);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.kind === "shock" ? effects.shockWidth : effects.rippleWidth;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, Math.max(1, radius), 0, Math.PI * 2);
        ctx.stroke();
        return;
      }
      const sprite = sprites.get(particle.color, effects.glowRadius);
      const size = sprite.sizePx * (0.6 + 0.4 * remaining) * particle.size * 0.5;
      ctx.drawImage(sprite.image, particle.x - size / 2, particle.y - size / 2, size, size);
    });
  }
}
