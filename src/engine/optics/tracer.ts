/*
 * Whole-scene light solver. Each source starts one ray; a work queue drains rays in order, casting
 * against prebuilt primitives and keeping the nearest hit with a deterministic tie order. Mirrors
 * reflect and requeue with skipId; absorbers end a path. Intensity, bounce, segment cap, repeat
 * state, non-finite data and the boundary all guarantee termination.
 */
import { gameConfig } from "@/config/gameConfig";
import { normalizeAngle, radToDeg } from "@/lib/math/angles";
import {
  MAX_BOUNCES,
  MAX_SEGMENTS,
  MIN_INTENSITY,
  MIRROR_REFLECTANCE,
  OFFSET,
} from "@/lib/math/constants";
import { add, headingToVec, scale } from "@/lib/math/vec2";
import type { HitEvent, OpticsResult, OpticsScene, Ray, Segment } from "@/types/optics";
import type { Vec2 } from "@/types/vec2";
import { reflect } from "./reflect";
import {
  buildPrimitives,
  createTerminations,
  nearestHit,
  warnInvalid,
} from "./primitives";
import { getSourceOrigin, isFinitePoint } from "./transform";

interface WorkRay extends Ray {
  seen: Set<string>;
}

type Clock = () => number;
const defaultClock: Clock = () =>
  typeof performance === "undefined" ? Date.now() : performance.now();

/** Repeat key from PRD §20.3: object id, position rounded to 0.5 wu, heading rounded to 0.5°. */
export function repeatStateKey(objectId: string, point: Vec2, dir: Vec2): string {
  const grid = gameConfig.optics.repeatPositionGrid;
  const angleGrid = gameConfig.optics.repeatAngleGridDeg;
  const heading = normalizeAngle(radToDeg(Math.atan2(dir.y, dir.x)));
  return `${objectId}|${Math.round(point.x / grid)}|${Math.round(point.y / grid)}|${Math.round(heading / angleGrid)}`;
}

function createInitialRay(source: OpticsScene["sources"][number]): WorkRay | null {
  const dir = headingToVec(source.headingDeg);
  if (!isFinitePoint(dir) || !isFinitePoint(source.position) || !Number.isFinite(source.intensity)) {
    warnInvalid(`source ${source.id} has non-finite data; skipped`);
    return null;
  }
  return {
    origin: getSourceOrigin(source),
    dir,
    color: { ...source.color },
    intensity: source.intensity,
    bounce: 0,
    skipId: source.id,
    sourceId: source.id,
    seen: new Set<string>(),
  };
}

/** Solves all sources against one immutable snapshot of scene geometry. */
export function solveOptics(scene: OpticsScene, clock: Clock = defaultClock): OpticsResult {
  const startedAt = clock();
  const primitives = buildPrimitives(scene);
  const terminated = createTerminations();
  const segments: Segment[] = new Array<Segment>(MAX_SEGMENTS);
  const events: HitEvent[] = new Array<HitEvent>(MAX_SEGMENTS);
  const queue: WorkRay[] = [];
  let segmentCount = 0;
  let eventCount = 0;
  let maxBounce = 0;

  for (const source of scene.sources) {
    const ray = createInitialRay(source);
    if (ray) queue.push(ray);
    else terminated.invalid += 1;
  }

  let cursor = 0;
  while (cursor < queue.length && segmentCount < MAX_SEGMENTS) {
    const ray = queue[cursor];
    cursor += 1;
    if (!isFinitePoint(ray.origin) || !isFinitePoint(ray.dir) || !Number.isFinite(ray.intensity)) {
      terminated.invalid += 1;
      continue;
    }
    if (ray.intensity < MIN_INTENSITY) {
      terminated.intensity += 1;
      continue;
    }
    if (ray.bounce >= MAX_BOUNCES) {
      terminated.bounce += 1;
      continue;
    }

    const hit = nearestHit(ray, primitives);
    if (hit === null) {
      terminated.noHit += 1;
      continue;
    }
    const point = add(ray.origin, scale(ray.dir, hit.t));
    if (!isFinitePoint(point)) {
      terminated.invalid += 1;
      continue;
    }

    segments[segmentCount] = {
      a: { ...ray.origin },
      b: point,
      color: { ...ray.color },
      intensity: ray.intensity,
      bounce: ray.bounce,
      kind: "beam",
    };
    segmentCount += 1;
    maxBounce = Math.max(maxBounce, ray.bounce);

    const event: HitEvent = {
      objectId: hit.primitive.id,
      type: hit.primitive.type,
      point,
      incident: { ...ray.dir },
      color: { ...ray.color },
      intensity: ray.intensity,
      bounce: ray.bounce,
    };
    if (hit.primitive.type === "mirror") {
      event.normal = hit.primitive.normal;
      event.reflected = reflect(ray.dir, hit.primitive.normal ?? { x: 0, y: 1 });
    }
    events[eventCount] = event;
    eventCount += 1;

    const key = repeatStateKey(hit.primitive.id, point, ray.dir);
    if (ray.seen.has(key)) {
      terminated.repeat += 1;
      continue;
    }
    ray.seen.add(key);

    if (hit.primitive.type !== "mirror") {
      terminated[hit.primitive.type] += 1;
      continue;
    }

    const normal = hit.primitive.normal ?? { x: 0, y: 1 };
    const reflected = reflect(ray.dir, normal);
    const origin = add(point, scale(reflected, OFFSET));
    const child: WorkRay = {
      origin,
      dir: reflected,
      color: { ...ray.color },
      intensity: ray.intensity * MIRROR_REFLECTANCE,
      bounce: ray.bounce + 1,
      skipId: hit.primitive.id,
      sourceId: ray.sourceId,
      seen: ray.seen,
    };
    if (!isFinitePoint(origin) || !isFinitePoint(reflected) || !Number.isFinite(child.intensity)) {
      warnInvalid(`mirror ${hit.primitive.id} produced non-finite light; path ended`);
      terminated.invalid += 1;
      continue;
    }
    queue.push(child);
  }
  if (segmentCount >= MAX_SEGMENTS && cursor < queue.length) terminated.segmentCap += 1;

  segments.length = segmentCount;
  events.length = eventCount;
  return {
    segments,
    events,
    stats: {
      segmentCount,
      maxBounce,
      terminated,
      solveMs: clock() - startedAt,
    },
  };
}
