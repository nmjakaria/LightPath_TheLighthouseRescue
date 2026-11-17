/*
 * Living night backdrop: deterministic twinkling stars, parallax water bands, slow mist and a
 * decorative lighthouse sweep. All phases use the loop's accumulated seconds, and reduced motion
 * freezes the sweep while dampening the other amplitudes (PRD §12.5, FR-058/FR-061/FR-063).
 */
import { visualConfig } from "@/config/visualConfig";
import { WORLD } from "@/lib/math/constants";
import { mistOffset, starAlpha, sweepAngleDeg, waterY } from "../animation";
import type { VisualSettings } from "../visualSettings";
import type { Layer } from "../Layer";
import type { Palette } from "../palette";

const { animation } = visualConfig;
const LIGHTHOUSE = { x: WORLD.width - 190, y: WORLD.height - 265 };

export class EnvironmentLayer implements Layer {
  readonly name = "environment";

  constructor(
    private readonly palette: Palette,
    private readonly visuals: VisualSettings,
  ) {}

  draw({ ctx, stats }: Parameters<Layer["draw"]>[0]): void {
    const time = stats.elapsedSec;
    ctx.save();
    this.drawStars(ctx, time);
    this.drawWater(ctx, time);
    this.drawMist(ctx, time);
    if (!this.visuals.reducedMotion) this.drawSweep(ctx, time);
    ctx.restore();
  }

  private drawStars(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = this.palette.softWhite;
    for (let index = 0; index < animation.stars.count; index += 1) {
      const x = (index * 97) % WORLD.width;
      const y = (index * 53) % (WORLD.height * 0.65);
      ctx.globalAlpha = starAlpha(index, time, this.visuals.reducedMotion);
      ctx.beginPath();
      ctx.arc(x, y, animation.stars.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawWater(ctx: CanvasRenderingContext2D, time: number): void {
    const count = this.visuals.quality.waterLayers;
    ctx.lineWidth = 1.5;
    for (let layer = 0; layer < count; layer += 1) {
      ctx.strokeStyle = layer % 2 === 0 ? this.palette.oceanTeal : this.palette.cyanBeam;
      ctx.globalAlpha = 0.22 - layer * 0.03;
      ctx.beginPath();
      for (let step = 0; step <= animation.water.segments; step += 1) {
        const x = step / animation.water.segments * WORLD.width;
        const y = waterY(layer, x, time, count, this.visuals.reducedMotion);
        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawMist(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = this.palette.mist;
    ctx.globalAlpha = animation.mist.alpha;
    for (let layer = 0; layer < animation.mist.layers; layer += 1) {
      const offset = mistOffset(time, layer, this.visuals.reducedMotion) % (WORLD.width + 400);
      const y = WORLD.height - 120 + layer * animation.mist.height;
      ctx.beginPath();
      ctx.ellipse(offset - 200, y, 260, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(offset + WORLD.width - 200, y, 260, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawSweep(ctx: CanvasRenderingContext2D, time: number): void {
    const angle = sweepAngleDeg(time) * Math.PI / 180;
    const spread = 0.22;
    const reach = animation.sweep.radius;
    const tip = {
      x: LIGHTHOUSE.x + Math.cos(angle) * reach,
      y: LIGHTHOUSE.y + Math.sin(angle) * reach,
    };
    const gradient = ctx.createLinearGradient(LIGHTHOUSE.x, LIGHTHOUSE.y, tip.x, tip.y);
    gradient.addColorStop(0, this.palette.cyanBeam);
    gradient.addColorStop(1, "transparent");
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = animation.sweep.alpha;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(LIGHTHOUSE.x, LIGHTHOUSE.y);
    ctx.lineTo(
      LIGHTHOUSE.x + Math.cos(angle - spread) * reach,
      LIGHTHOUSE.y + Math.sin(angle - spread) * reach,
    );
    ctx.lineTo(
      LIGHTHOUSE.x + Math.cos(angle + spread) * reach,
      LIGHTHOUSE.y + Math.sin(angle + spread) * reach,
    );
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }
}
