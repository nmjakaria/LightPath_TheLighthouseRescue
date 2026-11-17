import { describe, expect, it, vi } from "vitest";
import { gameConfig } from "@/config/gameConfig";
import { drawTargetShape, targetShapeFor } from "@/engine/render/targetShapes";
import type { Palette } from "@/engine/render/palette";

const palette = Object.fromEntries(
  [
    "abyss",
    "midnight",
    "deepNavy",
    "navyLine",
    "cyanBeam",
    "oceanTeal",
    "beamCore",
    "softWhite",
    "mist",
    "starGold",
    "lightRed",
    "lightGreen",
    "lightBlue",
    "success",
    "warning",
    "danger",
  ].map((key) => [key, `#${key}`]),
) as Palette;

function context() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    rect: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: "",
    lineWidth: 0,
  };
}

const CORE = gameConfig.interaction.targetRadius * gameConfig.render.targetCoreFraction;
const SIZE = CORE * gameConfig.render.targetShapeFraction;

describe("target colour shape cues (NFR-016)", () => {
  it("maps each required colour to a distinct symbol", () => {
    expect(targetShapeFor("red")).toBe("triangle");
    expect(targetShapeFor("green")).toBe("circle");
    expect(targetShapeFor("blue")).toBe("square");
    expect(targetShapeFor("any")).toBeNull();
  });

  it("draws nothing extra for a colour-agnostic target", () => {
    const ctx = context();
    drawTargetShape(ctx as unknown as CanvasRenderingContext2D, "any", CORE, palette);
    expect(ctx.beginPath).not.toHaveBeenCalled();
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it("draws a red triangle, green circle and blue square with the matching token colour", () => {
    const red = context();
    drawTargetShape(red as unknown as CanvasRenderingContext2D, "red", CORE, palette);
    expect(red.moveTo).toHaveBeenCalledWith(0, -SIZE);
    expect(red.lineTo).toHaveBeenCalledWith(SIZE, SIZE);
    expect(red.closePath).toHaveBeenCalledTimes(1);
    expect(red.strokeStyle).toBe(palette.lightRed);
    expect(red.save).toHaveBeenCalledTimes(1);
    expect(red.restore).toHaveBeenCalledTimes(1);

    const green = context();
    drawTargetShape(green as unknown as CanvasRenderingContext2D, "green", CORE, palette);
    expect(green.arc).toHaveBeenCalledWith(0, 0, SIZE, 0, Math.PI * 2);
    expect(green.strokeStyle).toBe(palette.lightGreen);

    const blue = context();
    drawTargetShape(blue as unknown as CanvasRenderingContext2D, "blue", CORE, palette);
    expect(blue.rect).toHaveBeenCalledWith(-SIZE, -SIZE, SIZE * 2, SIZE * 2);
    expect(blue.strokeStyle).toBe(palette.lightBlue);
    expect(blue.lineWidth).toBe(gameConfig.render.targetShapeLineWidth);
  });
});
