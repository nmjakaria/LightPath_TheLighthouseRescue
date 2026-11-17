import { afterEach, describe, expect, it, vi } from "vitest";
import { BOUNDARY } from "@/lib/math/constants";
import { solveOptics } from "@/engine/optics/tracer";
import type { ObstacleConfig } from "@/types/optics";
import { circle, mirror, scene, source } from "./scenes";

afterEach(() => vi.restoreAllMocks());

describe("optics/tracer core (TC-G01, G03, E01-E03, E05)", () => {
  it("starts a 0° source with an east-going first segment", () => {
    const result = solveOptics(scene({ sources: [source("S1", { x: 120, y: 560 })] }));
    expect(result.segments).toHaveLength(1);
    const segment = result.segments[0];
    expect(segment.b.x).toBeGreaterThan(segment.a.x);
    expect(segment.b.y).toBe(segment.a.y);
    expect(segment.b.x).toBeCloseTo(BOUNDARY.x1, 9);
  });

  it("returns the nearer of two circles regardless of declaration order", () => {
    const near = circle("near", "target", { x: 300, y: 200 });
    const far = circle("far", "target", { x: 600, y: 200 });
    for (const circles of [[near, far], [far, near]]) {
      const result = solveOptics(
        scene({ sources: [source("S1", { x: 120, y: 200 })], circles }),
      );
      expect(result.events[0].objectId).toBe("near");
      expect(result.segments[0].b.x).toBeCloseTo(280, 9);
    }
  });

  it("applies deterministic type priority to an exact-distance tie", () => {
    const obstacle: ObstacleConfig = {
      id: "W1",
      vertices: [
        { x: 300, y: 180 },
        { x: 300, y: 220 },
      ],
    };
    const result = solveOptics(
      scene({
        sources: [source("S1", { x: 120, y: 200 })],
        mirrors: [mirror("M1", { x: 300, y: 200 })],
        obstacles: [obstacle],
      }),
    );
    expect(result.events[0].type).toBe("obstacle");
    expect(result.events[0].objectId).toBe("W1");
  });

  it("bounces a perpendicular beam back into its own lamp without a self-hit", () => {
    const result = solveOptics(
      scene({
        sources: [source("S1", { x: 120, y: 560 }, 0, 1, 18)],
        mirrors: [mirror("M1", { x: 500, y: 560 }, 90)],
        circles: [circle("S1", "lamp", { x: 120, y: 560 }, 18)],
      }),
    );
    expect(result.segments).toHaveLength(2);
    expect(result.events[0].objectId).toBe("M1");
    expect(result.events[1].objectId).toBe("S1");
    expect(result.events[1].type).toBe("lamp");
    expect(result.segments[1].b.x).toBeCloseTo(138, 6);
    expect(result.stats.terminated.lamp).toBe(1);
  });

  it("handles a near-grazing mirror without NaN or a hang", () => {
    const result = solveOptics(
      scene({
        sources: [source("S1", { x: 120, y: 560 })],
        mirrors: [mirror("M1", { x: 500, y: 560 }, 0.001)],
      }),
    );
    expect(result.stats.segmentCount).toBeGreaterThan(0);
    for (const segment of result.segments) {
      expect(Number.isFinite(segment.b.x)).toBe(true);
      expect(Number.isFinite(segment.b.y)).toBe(true);
    }
  });

  it("hits a mirror exactly at either endpoint deterministically", () => {
    for (const y of [512, 608]) {
      const input = scene({
        sources: [source("S1", { x: 120, y })],
        mirrors: [mirror("M1", { x: 500, y: 560 }, 90)],
      });
      const first = solveOptics(input);
      const second = solveOptics(input);
      expect(first.events[0].objectId).toBe("M1");
      expect(first.events[0].point.y).toBeCloseTo(y, 6);
      expect(second.segments).toEqual(first.segments);
    }
  });

  it("clips beams to the boundary in every cardinal direction", () => {
    for (const [heading, expected] of [
      [0, { x: BOUNDARY.x1, y: 360 }],
      [180, { x: BOUNDARY.x0, y: 360 }],
      [90, { x: 640, y: BOUNDARY.y1 }],
      [270, { x: 640, y: BOUNDARY.y0 }],
    ] as const) {
      const result = solveOptics(scene({ sources: [source("S1", { x: 640, y: 360 }, heading)] }));
      expect(result.segments[0].b.x).toBeCloseTo(expected.x, 6);
      expect(result.segments[0].b.y).toBeCloseTo(expected.y, 6);
      expect(result.stats.terminated.boundary).toBe(1);
    }
  });
});

describe("optics/tracer absorbers and invalid input", () => {
  it("absorbs at obstacles, closed gates, switches, targets and skips open gates", () => {
    for (const [input, reason] of [
      [
        scene({
          sources: [source("S1", { x: 120, y: 200 })],
          obstacles: [{ id: "W1", vertices: [{ x: 300, y: 180 }, { x: 300, y: 220 }] }],
        }),
        "obstacle",
      ],
      [
        scene({
          sources: [source("S1", { x: 120, y: 200 })],
          gates: [{ id: "G1", a: { x: 300, y: 180 }, b: { x: 300, y: 220 } }],
        }),
        "gate",
      ],
      [
        scene({
          sources: [source("S1", { x: 120, y: 200 })],
          circles: [circle("SW1", "switch", { x: 300, y: 200 })],
        }),
        "switch",
      ],
      [
        scene({
          sources: [source("S1", { x: 120, y: 200 })],
          circles: [circle("T1", "target", { x: 300, y: 200 })],
        }),
        "target",
      ],
    ] as const) {
      const result = solveOptics(input);
      expect(result.stats.terminated[reason]).toBe(1);
    }

    const openGate = solveOptics(
      scene({
        sources: [source("S1", { x: 120, y: 200 })],
        gates: [{ id: "G1", a: { x: 300, y: 180 }, b: { x: 300, y: 220 }, openFraction: 0.5 }],
      }),
    );
    expect(openGate.events[0].type).toBe("boundary");
  });

  it("skips a NaN mirror with a dev warning and skips non-finite sources", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = solveOptics(
      scene({
        sources: [source("S1", { x: 120, y: 560 })],
        mirrors: [mirror("BAD", { x: 400, y: 560 }, Number.NaN)],
      }),
    );
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].b.x).toBeCloseTo(BOUNDARY.x1, 6);
    expect(warn).toHaveBeenCalled();

    const invalid = solveOptics(
      scene({ sources: [source("BAD", { x: 120, y: 560 }, Number.NaN)] }),
    );
    expect(invalid.stats.segmentCount).toBe(0);
    expect(invalid.stats.terminated.invalid).toBe(1);
  });

  it("terminates cleanly when a ray leaves the finite boundary geometry", () => {
    const result = solveOptics(scene({ sources: [source("S1", { x: 2000, y: 2000 })] }));
    expect(result.stats.segmentCount).toBe(0);
    expect(result.stats.terminated.noHit).toBe(1);
  });
});
