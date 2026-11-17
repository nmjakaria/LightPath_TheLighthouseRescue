/* Three-pass additive glow: a wide tinted halo, a narrow coloured body and a white core. Prism
 * interiors use one faint white pass because PRD §12.9 asks for a visible but subtle inside path.
 * Quality selects the brightest N passes; reduced motion freezes the moving dash highlight. */
import { gameConfig } from "@/config/gameConfig";
import { visualConfig } from "@/config/visualConfig";
import type { GameState } from "@/engine/core/GameState";
import { beamDashOffset, beamPulse } from "../animation";
import type { RGB } from "@/types/color";
import type { Segment } from "@/types/optics";
import type { Layer } from "../Layer";
import type { Palette } from "../palette";
import type { VisualSettings } from "../visualSettings";

export function beamColor(color: RGB, palette: Palette): string {
  const threshold = gameConfig.optics.mixedThreshold;
  if (color.r >= 1 - threshold && color.g <= threshold && color.b <= threshold) return palette.lightRed;
  if (color.g >= 1 - threshold && color.r <= threshold && color.b <= threshold) return palette.lightGreen;
  if (color.b >= 1 - threshold && color.r <= threshold && color.g <= threshold) return palette.lightBlue;
  return palette.cyanBeam;
}

export class BeamLayer implements Layer {
  readonly name = "beams";

  constructor(
    private readonly palette: Palette,
    private readonly state: GameState,
    private readonly visuals?: VisualSettings,
  ) {}

  draw({ ctx, stats }: Parameters<Layer["draw"]>[0]): void {
    const passes = gameConfig.render.beamPasses;
    const passCount = Math.min(passes.length, Math.max(1, this.visuals?.quality.glowPasses ?? passes.length));
    const reduced = this.visuals?.reducedMotion ?? false;
    const time = stats.elapsedSec;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const segment of this.state.result.segments) {
      if (segment.kind === "prismInterior") this.drawInterior(ctx, segment);
      else this.drawSegment(ctx, segment, passes.slice(-passCount), time, reduced);
    }
    if (!reduced && passCount > 1) this.drawDashes(ctx, time, passes[passes.length - 1].width);
    ctx.restore();
  }

  private drawSegment(
    ctx: CanvasRenderingContext2D,
    segment: Segment,
    passes: readonly { width: number; alpha: number; core: boolean }[],
    time: number,
    reduced: boolean,
  ): void {
    const color = beamColor(segment.color, this.palette);
    const intensity = Math.min(1, Math.max(0, segment.intensity));
    const pulse = beamPulse(time, reduced);
    for (const pass of passes) {
      ctx.strokeStyle = pass.core ? this.palette.beamCore : color;
      ctx.globalAlpha = Math.min(1, pass.alpha * intensity * pulse);
      ctx.lineWidth = pass.width;
      this.trace(ctx, segment);
    }
  }

  private drawInterior(ctx: CanvasRenderingContext2D, segment: Segment): void {
    ctx.strokeStyle = this.palette.beamCore;
    ctx.globalAlpha = gameConfig.render.prismInteriorAlpha * Math.min(1, Math.max(0, segment.intensity));
    ctx.lineWidth = gameConfig.render.prismInteriorWidth;
    this.trace(ctx, segment);
  }

  private drawDashes(ctx: CanvasRenderingContext2D, time: number, coreWidth: number): void {
    ctx.setLineDash([visualConfig.animation.beamDash, visualConfig.animation.beamGap]);
    ctx.lineDashOffset = beamDashOffset(time);
    ctx.strokeStyle = this.palette.beamCore;
    ctx.lineWidth = coreWidth;
    for (const segment of this.state.result.segments) {
      if (segment.kind === "prismInterior") continue;
      ctx.globalAlpha = 0.35 * Math.min(1, Math.max(0, segment.intensity));
      this.trace(ctx, segment);
    }
    ctx.setLineDash([]);
  }

  private trace(ctx: CanvasRenderingContext2D, segment: Segment): void {
    ctx.beginPath();
    ctx.moveTo(segment.a.x, segment.a.y);
    ctx.lineTo(segment.b.x, segment.b.y);
    ctx.stroke();
  }
}
