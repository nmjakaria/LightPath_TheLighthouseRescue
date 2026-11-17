/*
 * Pure bridge from the tracer's HitEvent array to the Inspector. It never recomputes a reflection:
 * the printed d, n and r are the exact vectors solveOptics produced, so TC-G13 compares the panel
 * against the solver rather than a second implementation. Only the derived d·n and equal angles
 * are calculated here from those same vectors.
 */
import { inspectorConfig } from "@/config/inspectorConfig";
import { radToDeg } from "@/lib/math/angles";
import { dot } from "@/lib/math/vec2";
import type { HitEvent, OpticsResult } from "@/types/optics";
import type { InspectorHit, InspectorSnapshot, PresentationState } from "@/types/inspector";
import type { Vec2 } from "@/types/vec2";

function angleBetween(a: Vec2, b: Vec2): number {
  const cosine = Math.max(-1, Math.min(1, dot(a, b)));
  return radToDeg(Math.acos(Math.abs(cosine)));
}

/** The selected component wins; otherwise show the first mirror hit, then any hit. */
export function selectHitEvent(events: readonly HitEvent[], selectedId: string | null): HitEvent | null {
  if (selectedId) {
    const selected = events.find((event) => event.objectId === selectedId);
    if (selected) return selected;
  }
  return events.find((event) => event.type === "mirror") ?? events[0] ?? null;
}

export function buildInspectorHit(event: HitEvent): InspectorHit {
  const incident = event.incident ?? null;
  const normal = event.normal ?? null;
  const reflected = event.reflected ?? null;
  const normalDot = incident && normal ? dot(incident, normal) : null;
  return {
    objectId: event.objectId,
    type: event.type,
    point: { ...event.point },
    incident,
    normal,
    reflected,
    dot: normalDot,
    incidenceDeg: incident && normal ? angleBetween(incident, normal) : null,
    reflectionDeg: reflected && normal ? angleBetween(reflected, normal) : null,
    bounce: event.bounce,
  };
}

export function buildInspectorSnapshot(
  result: OpticsResult,
  selectedId: string | null,
  presentation: PresentationState,
): InspectorSnapshot {
  const event = selectHitEvent(result.events, selectedId);
  return {
    ...presentation,
    hit: event ? buildInspectorHit(event) : null,
    eventCount: result.events.length,
    segmentCount: result.stats.segmentCount,
    maxBounce: result.stats.maxBounce,
    solveMs: result.stats.solveMs,
  };
}

export function formatNumber(value: number | null): string {
  return value === null ? "—" : value.toFixed(inspectorConfig.decimals);
}

export function formatVector(value: Vec2 | null): string {
  return value ? `(${formatNumber(value.x)}, ${formatNumber(value.y)})` : "—";
}
