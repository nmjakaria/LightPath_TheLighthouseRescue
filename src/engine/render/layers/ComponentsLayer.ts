/* Draws the physical components from the same geometry the solver uses. New mechanics reuse the
 * pure shape helpers so the layer stays a short ordered pass rather than a second geometry model. */
import { gameConfig } from "@/config/gameConfig";
import type { GameState } from "@/engine/core/GameState";
import { worldVertices } from "@/game/movableObstacles";
import { getMirrorEndpoints } from "@/engine/optics/transform";
import { headingToVec } from "@/lib/math/vec2";
import { BOUNDARY, MIRROR_LENGTH } from "@/lib/math/constants";
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
import { drawTargetShape } from "../targetShapes";
import type { VisualSettings } from "../visualSettings";
import type { Layer } from "../Layer";
import type { Palette } from "../palette";

export class ComponentsLayer implements Layer {
  readonly name = "components";

  constructor(
    private readonly palette: Palette,
    private readonly state: GameState,
    private readonly visuals?: VisualSettings,
  ) {}

  draw({ ctx, stats }: Parameters<Layer["draw"]>[0]): void {
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
    this.drawHint(ctx, stats.elapsedSec);
    ctx.restore();
  }

  /** Tier 2 pulses the next component; tier 3 overlays its solved angle or slide position. */
  private drawHint(ctx: CanvasRenderingContext2D, elapsedSec: number): void {
    const hint = this.state.hint;
    if (!hint?.componentId) return;
    const { hints, render } = gameConfig;
    const pulse = this.state.reducedMotion
      ? 1
      : 0.65 + 0.35 * Math.sin(elapsedSec * Math.PI * 2 * hints.pulseHz);
    ctx.save();
    ctx.strokeStyle = this.palette.starGold;
    ctx.lineWidth = render.lineWidth.halo;
    ctx.lineCap = "round";

    const mirror = this.state.mirrors.find((item) => item.id === hint.componentId);
    if (mirror) {
      const ghost = hint.angleDeg === undefined ? mirror : { ...mirror, angleDeg: hint.angleDeg };
      ctx.globalAlpha = hint.angleDeg === undefined ? hints.outlineAlpha * pulse : hints.ghostAlpha;
      this.strokeSegment(ctx, getMirrorEndpoints(ghost));
      ctx.restore();
      return;
    }

    const source = this.state.sources.find((item) => item.id === hint.componentId);
    if (source) {
      const heading = hint.angleDeg ?? source.headingDeg;
      const direction = headingToVec(heading);
      ctx.globalAlpha = hint.angleDeg === undefined ? hints.outlineAlpha * pulse : hints.ghostAlpha;
      const tip = {
        x: source.position.x + direction.x * MIRROR_LENGTH,
        y: source.position.y + direction.y * MIRROR_LENGTH,
      };
      this.strokeSegment(ctx, [source.position, tip]);
      ctx.restore();
      return;
    }

    const obstacle = this.state.movableObstacles.find((item) => item.id === hint.componentId);
    if (obstacle && hint.position) {
      ctx.globalAlpha = hints.ghostAlpha;
      const ghost = { ...obstacle, position: hint.position };
      drawObstacle(ctx, worldVertices(ghost), this.palette, true);
    }
    ctx.restore();
  }

  private strokeSegment(ctx: CanvasRenderingContext2D, endpoints: readonly Vec2[]): void {
    ctx.beginPath();
    ctx.moveTo(endpoints[0].x, endpoints[0].y);
    ctx.lineTo(endpoints[1].x, endpoints[1].y);
    ctx.stroke();
  }

  private isHighlighted(id: string): boolean {
    return this.state.hoveredId === id || this.state.selectedId === id;
  }

  private drawBoundary(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = this.palette.navyLine;
    ctx.lineWidth = gameConfig.render.lineWidth.boundary;
    ctx.strokeRect(BOUNDARY.x0, BOUNDARY.y0, BOUNDARY.x1 - BOUNDARY.x0, BOUNDARY.y1 - BOUNDARY.y0);
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
    drawTargetShape(ctx, target.requires, target.radius * targetCoreFraction, this.palette, this.visuals?.colorblindAid);
    if (target.chargeSec > 0 && !target.active) this.drawChargeArc(ctx, target, chargeArcOffsetPx);
    ctx.fillStyle = this.palette.mist;
    ctx.fillText(target.id, target.radius + labelOffsetPx, -target.radius);
    ctx.restore();
  }

  private drawChargeArc(
    ctx: CanvasRenderingContext2D,
    target: TargetRuntime,
    offset: number,
  ): void {
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
    if (!mirror.rotatable)
      drawLockBadge(ctx, mirror.center.x + labelOffsetPx, mirror.center.y, this.palette);
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
