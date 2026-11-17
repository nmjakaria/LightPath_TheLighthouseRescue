/*
 * PRD NFR-016: colour is never the only cue. Each required target colour also carries a distinct
 * geometric symbol drawn inside its core — red ▲, green ●, blue ■ — using the same design tokens as
 * the beams. The "any" target keeps the plain core because it has no colour rule to convey.
 */
import { gameConfig } from "@/config/gameConfig";
import type { Palette } from "./palette";
import type { TargetColor } from "@/types/level";

export type TargetShape = "triangle" | "circle" | "square";

export function targetShapeFor(requires: TargetColor): TargetShape | null {
  if (requires === "red") return "triangle";
  if (requires === "green") return "circle";
  if (requires === "blue") return "square";
  return null;
}

export function drawTargetShape(
  ctx: CanvasRenderingContext2D,
  requires: TargetColor,
  coreRadius: number,
  palette: Palette,
): void {
  const shape = targetShapeFor(requires);
  if (!shape) return;
  const size = coreRadius * gameConfig.render.targetShapeFraction;
  ctx.save();
  ctx.strokeStyle =
    requires === "red"
      ? palette.lightRed
      : requires === "green"
        ? palette.lightGreen
        : palette.lightBlue;
  ctx.lineWidth = gameConfig.render.targetShapeLineWidth;
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(0, 0, size, 0, Math.PI * 2);
  } else if (shape === "triangle") {
    ctx.moveTo(0, -size);
    ctx.lineTo(size, size);
    ctx.lineTo(-size, size);
    ctx.closePath();
  } else {
    ctx.rect(-size, -size, size * 2, size * 2);
  }
  ctx.stroke();
  ctx.restore();
}
