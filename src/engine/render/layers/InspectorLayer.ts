/*
 * Canvas overlay for the teaching tools (PRD FR-041/§12.10). It draws only data already present in
 * the solver result: hit points, bounce numbers, the selected mirror's extended line, and the exact
 * incident/normal/reflected vectors for the selected hit. Normals-only mode hides the other marks.
 */
import { inspectorConfig } from "@/config/inspectorConfig";
import { buildInspectorHit, selectHitEvent } from "@/engine/core/inspector";
import { getMirrorEndpoints } from "@/engine/optics/transform";
import { add, normalize, scale, sub } from "@/lib/math/vec2";
import type { HitEvent } from "@/types/optics";
import type { Vec2 } from "@/types/vec2";
import type { GameState } from "@/engine/core/GameState";
import type { Layer } from "../Layer";
import type { Palette } from "../palette";

const FULL_TURN = Math.PI * 2;

export class InspectorLayer implements Layer {
  readonly name = "inspector";

  constructor(
    private readonly palette: Palette,
    private readonly state: GameState,
  ) {}

  draw({ ctx, stats }: Parameters<Layer["draw"]>[0]): void {
    const presentation = this.state.presentation.state;
    if (!presentation.inspector) return;
    ctx.save();
    ctx.font = inspectorConfig.text.font;
    ctx.lineWidth = inspectorConfig.vector.lineWidth;
    if (presentation.normalsOnly) this.drawNormals(ctx);
    else this.drawFullInspector(ctx);
    this.drawFrameBadge(ctx, stats.frameMs, stats.fps);
    ctx.restore();
  }

  private drawNormals(ctx: CanvasRenderingContext2D): void {
    for (const event of this.state.result.events) {
      if (!event.normal) continue;
      this.normal(ctx, event.point, event.normal, this.palette.lightBlue);
    }
  }

  private drawFullInspector(ctx: CanvasRenderingContext2D): void {
    for (const event of this.state.result.events) this.hitPoint(ctx, event);
    this.extendedMirrorLine(ctx);
    const event = selectHitEvent(this.state.result.events, this.state.selectedId);
    if (!event) return;
    const hit = buildInspectorHit(event);
    if (!hit.normal || !hit.incident || !hit.reflected) return;
    this.normal(ctx, hit.point, hit.normal, this.palette.lightBlue);
    this.arrow(ctx, sub(hit.point, scale(hit.incident, inspectorConfig.vector.length)), hit.point,
      this.palette.warning);
    this.arrow(ctx, hit.point, add(hit.point, scale(hit.reflected, inspectorConfig.vector.length)),
      this.palette.success);
    const back = scale(hit.incident, -1);
    this.arc(ctx, hit.point, back, hit.normal, this.palette.warning);
    this.arc(ctx, hit.point, hit.normal, hit.reflected, this.palette.success);
  }

  private hitPoint(ctx: CanvasRenderingContext2D, event: HitEvent): void {
    const { radius, labelDx, labelDy } = inspectorConfig.hit;
    ctx.fillStyle = this.colorFor(event);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(event.point.x, event.point.y, radius, 0, FULL_TURN);
    ctx.fill();
    ctx.fillText(String(event.bounce), event.point.x + labelDx, event.point.y + labelDy);
  }

  private extendedMirrorLine(ctx: CanvasRenderingContext2D): void {
    const id = this.state.selectedId;
    if (!id || this.state.kindOf(id) !== "mirror") return;
    const mirror = this.state.mirrors.find((item) => item.id === id);
    if (!mirror) return;
    const [a, b] = getMirrorEndpoints(mirror);
    const segment = sub(b, a);
    const direction = normalize(segment);
    const length = Math.hypot(segment.x, segment.y) * inspectorConfig.mirrorLine.extend;
    ctx.save();
    ctx.strokeStyle = this.palette.starGold;
    ctx.globalAlpha = inspectorConfig.normal.faintAlpha;
    ctx.setLineDash(inspectorConfig.mirrorLine.dash);
    ctx.beginPath();
    ctx.moveTo(a.x - direction.x * length, a.y - direction.y * length);
    ctx.lineTo(b.x + direction.x * length, b.y + direction.y * length);
    ctx.stroke();
    ctx.restore();
  }

  private normal(ctx: CanvasRenderingContext2D, point: Vec2, normal: Vec2, color: string): void {
    const { length, head, faintAlpha } = inspectorConfig.normal;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = faintAlpha;
    this.arrow(ctx, point, add(point, scale(normal, -length)), color, head, faintAlpha);
    ctx.globalAlpha = 1;
    this.arrow(ctx, point, add(point, scale(normal, length)), color, head);
  }

  private arrow(
    ctx: CanvasRenderingContext2D,
    from: Vec2,
    to: Vec2,
    color: string,
    head: number = inspectorConfig.vector.head,
    alpha: number = 1,
  ): void {
    const direction = normalize(sub(to, from));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    const left = { x: to.x - direction.x * head - direction.y * head / 2,
      y: to.y - direction.y * head + direction.x * head / 2 };
    const right = { x: to.x - direction.x * head + direction.y * head / 2,
      y: to.y - direction.y * head - direction.x * head / 2 };
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private arc(ctx: CanvasRenderingContext2D, point: Vec2, from: Vec2, to: Vec2, color: string): void {
    const start = Math.atan2(from.y, from.x);
    let delta = Math.atan2(to.y, to.x) - start;
    while (delta > Math.PI) delta -= FULL_TURN;
    while (delta < -Math.PI) delta += FULL_TURN;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(point.x, point.y, inspectorConfig.arc.radius, start, start + delta, delta < 0);
    ctx.stroke();
  }

  private drawFrameBadge(ctx: CanvasRenderingContext2D, frameMs: number, fps: number): void {
    const { x, y, frameDecimals } = inspectorConfig.text;
    const { segmentCount } = this.state.result.stats;
    const eventCount = this.state.result.events.length;
    ctx.fillStyle = this.palette.mist;
    ctx.globalAlpha = 1;
    ctx.fillText(
      `FPS ${Math.round(fps)} · ${frameMs.toFixed(frameDecimals)} ms · ${segmentCount} segments · ${eventCount} hits`,
      x, y,
    );
  }

  private colorFor(event: HitEvent): string {
    switch (event.type) {
      case "mirror": return this.palette.starGold;
      case "prism": return this.palette.cyanBeam;
      case "boundary": return this.palette.mist;
      default: return this.palette.danger;
    }
  }
}
