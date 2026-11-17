import { describe, expect, it } from "vitest";
import { gameConfig } from "@/config/gameConfig";
import { BOUNDARY } from "@/lib/math/constants";
import {
  getBoundarySegments,
  getGateSegment,
  getMirrorEndpoints,
  getPrismVertices,
  getSourceOrigin,
  isFinitePoint,
} from "@/engine/optics/transform";

describe("optics/transform", () => {
  it("places a horizontal mirror's endpoints L/2 either side of its centre", () => {
    const [a, b] = getMirrorEndpoints({ id: "M", center: { x: 500, y: 300 }, angleDeg: 0, length: 96 });
    expect(a).toEqual({ x: 452, y: 300 });
    expect(b).toEqual({ x: 548, y: 300 });
  });

  it("rotates mirror endpoints about the centre and uses the configured default length", () => {
    const [a, b] = getMirrorEndpoints({ id: "M", center: { x: 500, y: 300 }, angleDeg: 90 });
    const half = gameConfig.interaction.mirrorLength / 2;
    expect(a.x).toBeCloseTo(500, 9);
    expect(a.y).toBeCloseTo(300 - half, 9);
    expect(b.y).toBeCloseTo(300 + half, 9);
    // A mirror line repeats at +180°, so the geometry must be identical.
    const [c, d] = getMirrorEndpoints({ id: "M", center: { x: 500, y: 300 }, angleDeg: 270 });
    expect(c.x).toBeCloseTo(b.x, 9);
    expect(c.y).toBeCloseTo(b.y, 9);
    expect(d.x).toBeCloseTo(a.x, 9);
    expect(d.y).toBeCloseTo(a.y, 9);
  });

  it("detects non-finite geometry from invalid angles", () => {
    const [a, b] = getMirrorEndpoints({ id: "M", center: { x: 500, y: 300 }, angleDeg: Number.NaN });
    expect(isFinitePoint(a)).toBe(false);
    expect(isFinitePoint(b)).toBe(false);
    expect(isFinitePoint({ x: 1, y: 2 })).toBe(true);
  });

  it("builds an equilateral prism fan from its circumradius", () => {
    const vertices = getPrismVertices({
      center: { x: 300, y: 300 },
      circumradius: 40,
      orientationDeg: 0,
    });
    expect(vertices).toHaveLength(3);
    for (const vertex of vertices) {
      expect(Math.hypot(vertex.x - 300, vertex.y - 300)).toBeCloseTo(40, 9);
    }
    expect(vertices[1].y).toBeGreaterThan(vertices[0].y);
    expect(vertices[2].y).toBeLessThan(vertices[0].y);
  });

  it("returns the gate segment and the four boundary edges", () => {
    const gate = { id: "G", a: { x: 10, y: 20 }, b: { x: 30, y: 40 } };
    expect(getGateSegment(gate)).toEqual([gate.a, gate.b]);
    const edges = getBoundarySegments();
    expect(edges).toHaveLength(4);
    expect(edges[0]).toEqual([{ x: BOUNDARY.x0, y: BOUNDARY.y0 }, { x: BOUNDARY.x1, y: BOUNDARY.y0 }]);
    expect(edges[3]).toEqual([{ x: BOUNDARY.x0, y: BOUNDARY.y1 }, { x: BOUNDARY.x0, y: BOUNDARY.y0 }]);
  });

  it("offsets a source origin along its heading by the lamp housing radius", () => {
    const source = {
      id: "S1",
      position: { x: 120, y: 560 },
      headingDeg: 0,
      color: { r: 1, g: 1, b: 1 },
      intensity: 1,
    };
    expect(getSourceOrigin(source)).toEqual({ x: 136, y: 560 });
    const down = getSourceOrigin({ ...source, headingDeg: 90, housingRadius: 10 });
    expect(down.x).toBeCloseTo(120, 9);
    expect(down.y).toBeCloseTo(570, 9);
  });
});
