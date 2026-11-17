/*
 * Static night background rendered once into an offscreen canvas at capped device resolution.
 * The main frame only blits that cache, keeping the per-frame draw work small. Star positions are
 * deterministic functions of their index, so the cache is stable across reloads.
 */
import { gameConfig } from "@/config/gameConfig";
import { WORLD } from "@/lib/math/constants";
import type { Layer } from "../Layer";
import type { Palette } from "../palette";

export class BackgroundLayer implements Layer {
  readonly name = "background";
  private cache: HTMLCanvasElement | null = null;

  constructor(
    private readonly palette: Palette,
    private readonly maxDpr: number = gameConfig.render.maxDpr,
    private readonly starCount: number = gameConfig.render.backgroundStars,
  ) {}

  draw({ ctx }: Parameters<Layer["draw"]>[0]): void {
    const cache = this.ensureCache();
    if (cache) ctx.drawImage(cache, 0, 0, WORLD.width, WORLD.height);
  }

  dispose(): void {
    this.cache = null;
  }

  private ensureCache(): HTMLCanvasElement | null {
    if (this.cache) return this.cache;
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    const pixelScale = this.maxDpr;
    canvas.width = WORLD.width * pixelScale;
    canvas.height = WORLD.height * pixelScale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    this.paint(ctx);
    this.cache = canvas;
    return canvas;
  }

  private paint(ctx: CanvasRenderingContext2D): void {
    const { palette } = this;
    ctx.fillStyle = palette.abyss;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.fillStyle = palette.mist;
    for (let index = 0; index < this.starCount; index += 1) {
      const x = (index * 97) % WORLD.width;
      const y = (index * 53) % (WORLD.height * 0.65);
      ctx.globalAlpha = 0.25 + ((index % 4) * 0.15);
      ctx.beginPath();
      ctx.arc(x, y, index % 7 === 0 ? 2 : 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = palette.deepNavy;
    ctx.fillRect(0, WORLD.height - 110, WORLD.width, 110);
    ctx.strokeStyle = palette.navyLine;
    ctx.lineWidth = 2;
    for (let row = 0; row < 3; row += 1) {
      const y = WORLD.height - 82 + row * 28;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = palette.midnight;
    ctx.beginPath();
    ctx.ellipse(WORLD.width - 190, WORLD.height - 100, 150, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.softWhite;
    ctx.fillRect(WORLD.width - 215, WORLD.height - 265, 50, 165);
    ctx.fillStyle = palette.navyLine;
    ctx.beginPath();
    ctx.moveTo(WORLD.width - 222, WORLD.height - 265);
    ctx.lineTo(WORLD.width - 190, WORLD.height - 300);
    ctx.lineTo(WORLD.width - 158, WORLD.height - 265);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.12;
    ctx.fillStyle = palette.cyanBeam;
    ctx.beginPath();
    ctx.moveTo(WORLD.width - 190, WORLD.height - 285);
    ctx.lineTo(WORLD.width, WORLD.height - 420);
    ctx.lineTo(WORLD.width, WORLD.height - 190);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
