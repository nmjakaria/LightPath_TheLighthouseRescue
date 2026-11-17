/* Pure Canvas 2D drawing for physical components. Every dimension comes from gameConfig or level
 * data, and every colour comes from the resolved palette, so the renderer never invents tokens. */
import { gameConfig } from "@/config/gameConfig";
import { getPrismVertices } from "@/engine/optics/transform";
import type {
  GateRuntime,
  LevelPrismConfig,
  SourceRuntime,
  SwitchRuntime,
} from "@/types/level";
import type { Vec2 } from "@/types/vec2";
import type { Palette } from "./palette";

function tracePolygon(ctx: CanvasRenderingContext2D, vertices: readonly Vec2[]): void {
  if (vertices.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let index = 1; index < vertices.length; index += 1) ctx.lineTo(vertices[index].x, vertices[index].y);
  ctx.closePath();
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  vertices: readonly Vec2[],
  palette: Palette,
  highlighted: boolean,
): void {
  ctx.save();
  tracePolygon(ctx, vertices);
  ctx.fillStyle = palette.deepNavy;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = highlighted ? 1 : 0.8;
  ctx.strokeStyle = highlighted ? palette.cyanBeam : palette.navyLine;
  ctx.lineWidth = gameConfig.render.lineWidth.obstacle;
  ctx.stroke();
  ctx.restore();
}

export function drawPrism(ctx: CanvasRenderingContext2D, prism: LevelPrismConfig, palette: Palette): void {
  ctx.save();
  tracePolygon(ctx, getPrismVertices(prism));
  ctx.fillStyle = palette.navyLine;
  ctx.globalAlpha = 0.25;
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = palette.beamCore;
  ctx.lineWidth = gameConfig.render.lineWidth.prism;
  ctx.stroke();
  ctx.restore();
}

export function drawGate(ctx: CanvasRenderingContext2D, gate: GateRuntime, palette: Palette): void {
  ctx.save();
  ctx.strokeStyle = palette.danger;
  ctx.globalAlpha = Math.max(gameConfig.render.gateOpenAlpha, 1 - gate.openFraction);
  ctx.lineWidth = gate.thickness;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(gate.a.x, gate.a.y);
  ctx.lineTo(gate.b.x, gate.b.y);
  ctx.stroke();
  ctx.restore();
}

export function drawSwitch(ctx: CanvasRenderingContext2D, input: SwitchRuntime, palette: Palette): void {
  ctx.save();
  ctx.translate(input.center.x, input.center.y);
  ctx.strokeStyle = input.active ? palette.success : palette.starGold;
  ctx.lineWidth = gameConfig.render.lineWidth.switch;
  ctx.beginPath();
  ctx.arc(0, 0, input.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = input.active ? palette.success : palette.navyLine;
  ctx.beginPath();
  ctx.arc(0, 0, gameConfig.render.handleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawSource(
  ctx: CanvasRenderingContext2D,
  source: SourceRuntime,
  palette: Palette,
  highlighted: boolean,
): void {
  const radius = source.housingRadius ?? gameConfig.render.lampRadius;
  ctx.save();
  ctx.translate(source.position.x, source.position.y);
  ctx.strokeStyle = highlighted ? palette.cyanBeam : palette.navyLine;
  ctx.lineWidth = gameConfig.render.lineWidth.boundary;
  ctx.beginPath();
  ctx.arc(0, 0, gameConfig.interaction.lampHandleRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = palette.starGold;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.abyss;
  ctx.beginPath();
  ctx.arc(0, 0, gameConfig.render.lampCoreRadius, 0, Math.PI * 2);
  ctx.fill();
  if (!source.rotatable) drawLockBadge(ctx, radius, -radius, palette);
  ctx.restore();
}

export function drawLockBadge(ctx: CanvasRenderingContext2D, x: number, y: number, palette: Palette): void {
  ctx.save();
  ctx.fillStyle = palette.warning;
  ctx.beginPath();
  ctx.arc(x, y, gameConfig.render.lockBadgeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

