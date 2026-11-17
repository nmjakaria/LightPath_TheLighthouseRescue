/* Three-pass additive glow: a wide tinted halo, a narrow coloured body and a white core. Prism
 * interiors use one faint white pass because PRD §12.9 asks for a visible but subtle inside path. */
import { gameConfig } from "@/config/gameConfig";
import type { GameState } from "@/engine/core/GameState";
import type { RGB } from "@/types/color";
import type { Segment } from "@/types/optics";
import type { Layer } from "../Layer";
import type { Palette } from "../palette";

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
  ) {}

  draw({ ctx }: Parameters<Layer["draw"]>[0]): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const segment of this.state.result.segments) {
      if (segment.kind === "prismInterior") this.drawInterior(ctx, segment);
      else this.drawSegment(ctx, segment);
    }
    ctx.restore();
  }

  private drawSegment(ctx: CanvasRenderingContext2D, segment: Segment): void {
    const color = beamColor(segment.color, this.palette);
    for (const pass of gameConfig.render.beamPasses) {
      ctx.strokeStyle = pass.core ? this.palette.beamCore : color;
      ctx.globalAlpha = pass.alpha * Math.min(1, Math.max(0, segment.intensity));
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

  private trace(ctx: CanvasRenderingContext2D, segment: Segment): void {
    ctx.beginPath();
    ctx.moveTo(segment.a.x, segment.a.y);
    ctx.lineTo(segment.b.x, segment.b.y);
    ctx.stroke();
  }
}
