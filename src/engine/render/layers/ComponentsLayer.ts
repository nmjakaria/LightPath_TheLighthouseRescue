/* Draws the physical components from the same geometry the solver uses. The state object is owned
 * by the engine loop, so what the player sees is always the exact geometry light is traced against. */
import { gameConfig } from "@/config/gameConfig";
import type { GameState } from "@/engine/core/GameState";
import { getMirrorEndpoints } from "@/engine/optics/transform";
import { BOUNDARY } from "@/lib/math/constants";
import type { LevelMirrorConfig, TargetRuntime } from "@/types/level";
import type { Vec2 } from "@/types/vec2";
import type { Layer } from "../Layer";
import type { Palette } from "../palette";

export class ComponentsLayer implements Layer {
  readonly name = "components";

  constructor(
    private readonly palette: Palette,
    private readonly state: GameState,
  ) {}

  draw({ ctx }: Parameters<Layer["draw"]>[0]): void {
    const { lineWidth, labelFontSizePx } = gameConfig.render;
    ctx.save();
    ctx.font = `${labelFontSizePx}px ui-monospace, monospace`;
    ctx.strokeStyle = this.palette.navyLine;
    ctx.lineWidth = lineWidth.boundary;
    ctx.strokeRect(
      BOUNDARY.x0,
      BOUNDARY.y0,
      BOUNDARY.x1 - BOUNDARY.x0,
      BOUNDARY.y1 - BOUNDARY.y0,
    );
    this.drawLamp(ctx);
    for (const target of this.state.targets) this.drawTarget(ctx, target);
    for (const mirror of this.state.mirrors) this.drawMirror(ctx, mirror);
    ctx.restore();
  }

  private drawLamp(ctx: CanvasRenderingContext2D): void {
    const lamp = this.state.level.sources[0];
    if (!lamp) return;
    ctx.save();
    ctx.translate(lamp.position.x, lamp.position.y);
    ctx.fillStyle = this.palette.starGold;
    ctx.beginPath();
    ctx.arc(0, 0, lamp.housingRadius ?? gameConfig.render.lampRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.palette.abyss;
    ctx.beginPath();
    ctx.arc(0, 0, gameConfig.render.lampCoreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawTarget(ctx: CanvasRenderingContext2D, target: TargetRuntime): void {
    const { lineWidth } = gameConfig.render;
    ctx.save();
    ctx.translate(target.center.x, target.center.y);
    ctx.strokeStyle = target.active ? this.palette.success : this.palette.oceanTeal;
    ctx.lineWidth = lineWidth.target;
    ctx.beginPath();
    ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = target.active ? this.palette.success : this.palette.navyLine;
    ctx.beginPath();
    ctx.arc(0, 0, target.radius / 3, 0, Math.PI * 2);
    ctx.fill();
    if (target.chargeSec > 0 && !target.active) this.drawChargeArc(ctx, target);
    ctx.fillStyle = this.palette.mist;
    ctx.fillText(target.id, target.radius + 8, -target.radius);
    ctx.restore();
  }

  private drawChargeArc(ctx: CanvasRenderingContext2D, target: TargetRuntime): void {
    const fraction = Math.min(1, target.chargeSec / gameConfig.targets.activationSec);
    ctx.strokeStyle = this.palette.starGold;
    ctx.lineWidth = gameConfig.render.lineWidth.target;
    ctx.beginPath();
    ctx.arc(0, 0, target.radius + 6, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
    ctx.stroke();
  }

  private drawMirror(ctx: CanvasRenderingContext2D, mirror: LevelMirrorConfig): void {
    const [a, b] = getMirrorEndpoints(mirror);
    if (this.state.hoveredId === mirror.id || this.state.selectedId === mirror.id) {
      this.drawHighlight(ctx, a, b, this.state.selectedId === mirror.id);
    }
    ctx.strokeStyle = this.palette.beamCore;
    ctx.lineWidth = gameConfig.render.lineWidth.mirror;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.fillStyle = mirror.rotatable ? this.palette.mist : this.palette.starGold;
    ctx.fillText(mirror.rotatable ? mirror.id : `${mirror.id} (locked)`, mirror.center.x + 14, mirror.center.y - 14);
  }

  private drawHighlight(ctx: CanvasRenderingContext2D, a: Vec2, b: Vec2, selected: boolean): void {
    ctx.save();
    ctx.strokeStyle = this.palette.cyanBeam;
    ctx.globalAlpha = selected ? 0.7 : 0.35;
    ctx.lineWidth = selected
      ? gameConfig.render.lineWidth.halo
      : gameConfig.render.lineWidth.boundary;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }
}
