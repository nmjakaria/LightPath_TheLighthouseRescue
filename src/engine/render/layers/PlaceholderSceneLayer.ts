/*
 * STEP 6 preview of Level 1: lamp, two mirrors, boundary and target with a static solved-looking
 * beam. It exists to prove view mapping, layering and hover hit-testing; real state and optics
 * replace it in STEP 8. Drawing uses the same world coordinates the solver will consume.
 */
import { gameConfig } from "@/config/gameConfig";
import { degToRad } from "@/lib/math/angles";
import { BOUNDARY, MIRROR_LENGTH, TARGET_RADIUS } from "@/lib/math/constants";
import type { Vec2 } from "@/types/vec2";
import type { Layer } from "../Layer";
import type { Palette } from "../palette";

export interface PlaceholderSceneState {
  pointer: Vec2 | null;
  hoveredId: string | null;
  timeSec: number;
}

interface MirrorPreview {
  id: string;
  center: Vec2;
  angleDeg: number;
}

const MIRRORS: readonly MirrorPreview[] = [
  { id: "M1", center: { x: 500, y: 560 }, angleDeg: 135 },
  { id: "M2", center: { x: 500, y: 260 }, angleDeg: 135 },
];

const LAMP: Vec2 = { x: 120, y: 560 };
const TARGET: Vec2 = { x: 1000, y: 260 };

export function mirrorEndpoints(mirror: MirrorPreview): [Vec2, Vec2] {
  const half = MIRROR_LENGTH / 2;
  const angle = degToRad(mirror.angleDeg);
  const dx = Math.cos(angle) * half;
  const dy = Math.sin(angle) * half;
  return [
    { x: mirror.center.x - dx, y: mirror.center.y - dy },
    { x: mirror.center.x + dx, y: mirror.center.y + dy },
  ];
}

export function distanceToSegment(point: Vec2, a: Vec2, b: Vec2): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const lengthSq = vx * vx + vy * vy;
  if (lengthSq === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * vx + (point.y - a.y) * vy) / lengthSq));
  return Math.hypot(point.x - (a.x + t * vx), point.y - (a.y + t * vy));
}

export function hitTestPreview(point: Vec2 | null): string | null {
  if (!point) return null;
  for (const mirror of MIRRORS) {
    const [a, b] = mirrorEndpoints(mirror);
    if (distanceToSegment(point, a, b) <= gameConfig.render.selectionRadius) return mirror.id;
  }
  return Math.hypot(point.x - TARGET.x, point.y - TARGET.y) <= TARGET_RADIUS ? "T1" : null;
}

export class PlaceholderSceneLayer implements Layer {
  readonly name = "preview-scene";

  constructor(
    private readonly palette: Palette,
    private readonly state: PlaceholderSceneState,
  ) {}

  draw({ ctx }: Parameters<Layer["draw"]>[0]): void {
    ctx.strokeStyle = this.palette.navyLine;
    ctx.lineWidth = 2;
    ctx.strokeRect(BOUNDARY.x0, BOUNDARY.y0, BOUNDARY.x1 - BOUNDARY.x0, BOUNDARY.y1 - BOUNDARY.y0);

    this.drawBeam(ctx);
    this.drawLamp(ctx);
    for (const mirror of MIRRORS) this.drawMirror(ctx, mirror);
    this.drawTarget(ctx);
  }

  private drawBeam(ctx: CanvasRenderingContext2D): void {
    const path = [LAMP, MIRRORS[0].center, MIRRORS[1].center, TARGET];
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const [width, color, alpha] of [
      [10, this.palette.oceanTeal, 0.18],
      [4, this.palette.cyanBeam, 0.55],
      [1.5, this.palette.beamCore, 1],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let index = 1; index < path.length; index += 1) ctx.lineTo(path[index].x, path[index].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawLamp(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(LAMP.x, LAMP.y);
    ctx.fillStyle = this.palette.starGold;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.palette.abyss;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawMirror(ctx: CanvasRenderingContext2D, mirror: MirrorPreview): void {
    const [a, b] = mirrorEndpoints(mirror);
    ctx.save();
    if (this.state.hoveredId === mirror.id) {
      ctx.strokeStyle = this.palette.cyanBeam;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = this.palette.beamCore;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.fillStyle = this.palette.mist;
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(mirror.id, mirror.center.x + 14, mirror.center.y - 14);
    ctx.restore();
  }

  private drawTarget(ctx: CanvasRenderingContext2D): void {
    const pulse = 1 + Math.sin(this.state.timeSec) * 0.04;
    ctx.save();
    ctx.translate(TARGET.x, TARGET.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = this.palette.oceanTeal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, TARGET_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = this.palette.success;
    ctx.beginPath();
    ctx.arc(0, 0, TARGET_RADIUS / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.palette.mist;
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText("T1", TARGET_RADIUS + 8, -TARGET_RADIUS);
    ctx.restore();
  }
}
