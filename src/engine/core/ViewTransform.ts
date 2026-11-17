/*
 * Uniform 16:9 view mapping. The world is 1280x720 wu; the CSS canvas may be any size, so the
 * scale is min(width/1280, height/720) and the unused space is split into letterbox offsets.
 * Device pixels are a separate factor capped by config: ctx.setTransform(dpr*s, 0, 0, dpr*s,
 * dpr*ox, dpr*oy). Pointer input uses the inverse of the CSS part of that transform.
 */
import { gameConfig } from "@/config/gameConfig";
import type { Vec2 } from "@/types/vec2";
import { WORLD } from "@/lib/math/constants";

export interface CanvasSize {
  width: number;
  height: number;
}

export class ViewTransform {
  private cssWidth = 0;
  private cssHeight = 0;
  private dpr = 1;
  private scale = 0;
  private offsetX = 0;
  private offsetY = 0;

  constructor(
    private readonly world: CanvasSize = WORLD,
    private readonly maxDpr: number = gameConfig.render.maxDpr,
  ) {}

  resize(cssWidth: number, cssHeight: number, rawDpr = 1): void {
    this.cssWidth = Math.max(0, Number.isFinite(cssWidth) ? cssWidth : 0);
    this.cssHeight = Math.max(0, Number.isFinite(cssHeight) ? cssHeight : 0);
    const finiteDpr = Number.isFinite(rawDpr) && rawDpr > 0 ? rawDpr : 1;
    this.dpr = Math.min(this.maxDpr, Math.max(1, finiteDpr));

    if (this.cssWidth === 0 || this.cssHeight === 0) {
      this.scale = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }
    this.scale = Math.min(this.cssWidth / this.world.width, this.cssHeight / this.world.height);
    this.offsetX = (this.cssWidth - this.world.width * this.scale) / 2;
    this.offsetY = (this.cssHeight - this.world.height * this.scale) / 2;
  }

  toScreen(point: Vec2): Vec2 {
    return {
      x: this.offsetX + point.x * this.scale,
      y: this.offsetY + point.y * this.scale,
    };
  }

  /** Converts a pointer position in canvas CSS pixels (rect-relative) into world units. */
  toWorld(point: Vec2): Vec2 {
    if (this.scale === 0) return { x: 0, y: 0 };
    return {
      x: (point.x - this.offsetX) / this.scale,
      y: (point.y - this.offsetY) / this.scale,
    };
  }

  getScale(): number {
    return this.scale;
  }

  getOffset(): Vec2 {
    return { x: this.offsetX, y: this.offsetY };
  }

  getDpr(): number {
    return this.dpr;
  }

  getCssSize(): CanvasSize {
    return { width: this.cssWidth, height: this.cssHeight };
  }

  getDeviceSize(): CanvasSize {
    return {
      width: Math.round(this.cssWidth * this.dpr),
      height: Math.round(this.cssHeight * this.dpr),
    };
  }

  getDeviceTransform(): [number, number, number, number, number, number] {
    const s = this.scale * this.dpr;
    return [s, 0, 0, s, this.offsetX * this.dpr, this.offsetY * this.dpr];
  }
}
