import { describe, expect, it } from "vitest";
import {
  pointInPolygon,
  rayVsCircle,
  rayVsPolygon,
  rayVsSegment,
} from "@/engine/optics/intersect";
import type { Vec2 } from "@/types/vec2";

const origin: Vec2 = { x: 0, y: 0 };
const east: Vec2 = { x: 1, y: 0 };

describe("rayVsSegment (TC-G02)", () => {
  const a: Vec2 = { x: 10, y: -5 };
  const b: Vec2 = { x: 10, y: 5 };

  it("hits a crossing segment at the expected t", () => {
    expect(rayVsSegment(origin, east, a, b)).toBeCloseTo(10, 9);
  });

  it("misses parallel, behind, and off-segment rays", () => {
    expect(rayVsSegment(origin, east, { x: 10, y: 5 }, { x: 20, y: 5 })).toBeNull();
    expect(rayVsSegment(origin, { x: -1, y: 0 }, a, b)).toBeNull();
    expect(rayVsSegment(origin, east, { x: 10, y: 20 }, { x: 10, y: 30 })).toBeNull();
  });

  it("accepts both endpoints and the EPS_U overlap, but rejects larger overshoot", () => {
    expect(rayVsSegment(origin, east, { x: 10, y: 0 }, { x: 10, y: 10 })).toBeCloseTo(10, 9);
    expect(rayVsSegment(origin, east, { x: 10, y: -10 }, { x: 10, y: 0 })).toBeCloseTo(10, 9);
    // u = 10 / segmentLength: just past the endpoint is inside EPS_U, further past is a miss.
    expect(rayVsSegment(origin, east, { x: 10, y: -10 }, { x: 10, y: -0.0000005 })).not.toBeNull();
    expect(rayVsSegment(origin, east, { x: 10, y: -10 }, { x: 10, y: -0.00002 })).toBeNull();
  });
});

describe("rayVsCircle (TC-G04)", () => {
  const center: Vec2 = { x: 10, y: 0 };

  it("hits the near surface on a centre shot and on a tangent shot", () => {
    expect(rayVsCircle(origin, east, center, 2)).toBeCloseTo(8, 9);
    expect(rayVsCircle(origin, east, { x: 10, y: 2 }, 2)).toBeCloseTo(10, 9);
  });

  it("misses when the circle is off-axis or behind the ray", () => {
    expect(rayVsCircle(origin, east, { x: 10, y: 5 }, 2)).toBeNull();
    expect(rayVsCircle(origin, east, { x: -10, y: 0 }, 2)).toBeNull();
  });

  it("returns the exit t when the ray starts inside the circle", () => {
    expect(rayVsCircle({ x: 9, y: 0 }, east, center, 2)).toBeCloseTo(3, 9);
    expect(rayVsCircle({ x: 10, y: 0 }, east, center, 2)).toBeCloseTo(2, 9);
  });
});

describe("rayVsPolygon and pointInPolygon", () => {
  const square: Vec2[] = [
    { x: 10, y: 10 },
    { x: 30, y: 10 },
    { x: 30, y: 30 },
    { x: 10, y: 30 },
  ];

  it("returns the nearest polygon edge", () => {
    expect(rayVsPolygon({ x: 0, y: 20 }, east, square)).toBeCloseTo(10, 9);
    expect(rayVsPolygon({ x: 0, y: 40 }, east, square)).toBeNull();
    expect(rayVsPolygon({ x: 0, y: 20 }, { x: 0, y: 1 }, square)).toBeNull();
  });

  it("classifies interior, exterior, edge and degenerate polygons", () => {
    expect(pointInPolygon({ x: 20, y: 20 }, square)).toBe(true);
    expect(pointInPolygon({ x: 5, y: 20 }, square)).toBe(false);
    expect(pointInPolygon({ x: 10, y: 20 }, square)).toBe(true);
    expect(pointInPolygon({ x: 20, y: 20 }, square.slice(0, 2))).toBe(false);
  });
});
