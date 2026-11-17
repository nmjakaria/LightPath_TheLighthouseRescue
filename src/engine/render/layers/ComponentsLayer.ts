/* Draws the physical components from the same geometry the solver uses. New mechanics reuse the
 * pure shape helpers so the layer stays a short ordered pass rather than a second geometry model. */
import { gameConfig } from "@/config/gameConfig";
import type { GameState } from "@/engine/core/GameState";
import { worldVertices } from "@/game/movableObstacles";
import { getMirrorEndpoints } from "@/engine/optics/transform";
import { BOUNDARY } from "@/lib/math/constants";
import type { LevelMirrorConfig, TargetRuntime } from "@/types/level";
import type { Vec2 } from "@/types/vec2";
import {
  drawGate,
  drawLockBadge,
  drawObstacle,
  drawPrism,
  drawSource,
  drawSwitch,
} from "../componentShapes";
import type { Layer } from "../Layer";
import type { Palette } from "../palette";

export class ComponentsLayer implements Layer {
  readonly name = "components";

  constructor(
    private readonly palette: Palette,
    private readonly state: GameState,
  ) {}

  draw({ ctx }: Parameters<Layer["draw"]>[0]): void {
    const { labelFontSizePx } = gameConfig.render;
    ctx.save();
    ctx.font = `${labelFontSizePx}px ui-monospace, monospace`;
    this.drawBoundary(ctx);
    this.drawObstacles(ctx);
    for (const prism of this.state.level.prisms) drawPrism(ctx, prism, this.palette);
    for (const gate of this.state.gates) drawGate(ctx, gate, this.palette);
    for (const input of this.state.switches) drawSwitch(ctx, input, this.palette);
    for (const target of this.state.targets) this.drawTarget(ctx, target);
    for (const source of this.state.sources) {
      drawSource(ctx, source, this.palette, this.isHighlighted(source.id));
    }
    for (const mirror of this.state.mirrors) this.drawMirror(ctx, mirror);
    ctx.restore();
  }

  private isHighlighted(id: string): boolean {
    return this.state.hoveredId === id || this.state.selectedId === id;
  }

  private drawBoundary(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = this.palette.navyLine;
    ctx.lineWidth = gameConfig.render.lineWidth.boundary;
    ctx.strokeRect(
      BOUNDARY.x0,
      BOUNDARY.y0,
      BOUNDARY.x1 - BOUNDARY.x0,
      BOUNDARY.y1 - BOUNDARY.y0,
    );
  }

  private drawObstacles(ctx: CanvasRenderingContext2D): void {
    for (const obstacle of this.state.level.obstacles) {
      drawObstacle(ctx, obstacle.vertices, this.palette, this.isHighlighted(obstacle.id));
    }
    for (const obstacle of this.state.movableObstacles) {
      drawObstacle(ctx, worldVertices(obstacle), this.palette, this.isHighlighted(obstacle.id));
    }
  }

  private drawTarget(ctx: CanvasRenderingContext2D, target: TargetRuntime): void {
    const { lineWidth, labelOffsetPx, targetCoreFraction, chargeArcOffsetPx } = gameConfig.render;
    ctx.save();
    ctx.translate(target.center.x, target.center.y);
    ctx.strokeStyle = target.active ? this.palette.success : this.palette.oceanTeal;
    ctx.lineWidth = lineWidth.target;
    ctx.beginPath();
    ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = target.active ? this.palette.success : this.palette.navyLine;
    ctx.beginPath();
    ctx.arc(0, 0, target.radius * targetCoreFraction, 0, Math.PI * 2);
    ctx.fill();
    if (target.chargeSec > 0 && !target.active) this.drawChargeArc(ctx, target, chargeArcOffsetPx);
    ctx.fillStyle = this.palette.mist;
    ctx.fillText(target.id, target.radius + labelOffsetPx, -target.radius);
    ctx.restore();
  }

  private drawChargeArc(ctx: CanvasRenderingContext2D, target: TargetRuntime, offset: number): void {
    const fraction = Math.min(1, target.chargeSec / gameConfig.targets.activationSec);
    ctx.strokeStyle = this.palette.starGold;
    ctx.lineWidth = gameConfig.render.lineWidth.target;
    ctx.beginPath();
    ctx.arc(0, 0, target.radius + offset, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
    ctx.stroke();
  }

  private drawMirror(ctx: CanvasRenderingContext2D, mirror: LevelMirrorConfig): void {
    const { labelOffsetPx, lineWidth } = gameConfig.render;
    const [a, b] = getMirrorEndpoints(mirror);
    if (this.isHighlighted(mirror.id)) this.drawHighlight(ctx, a, b);
    ctx.strokeStyle = this.palette.beamCore;
    ctx.lineWidth = lineWidth.mirror;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.fillStyle = this.palette.mist;
    ctx.fillText(mirror.id, mirror.center.x + labelOffsetPx, mirror.center.y - labelOffsetPx);
    if (!mirror.rotatable) drawLockBadge(ctx, mirror.center.x + labelOffsetPx, mirror.center.y, this.palette);
  }

  private drawHighlight(ctx: CanvasRenderingContext2D, a: Vec2, b: Vec2): void {
    ctx.save();
    ctx.strokeStyle = this.palette.cyanBeam;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = gameConfig.render.lineWidth.halo;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }
}
