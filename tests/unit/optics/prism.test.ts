import { describe, expect, it } from "vitest";
import { gameConfig } from "@/config/gameConfig";
import { solveOptics } from "@/engine/optics/tracer";
import { getPrismVertices } from "@/engine/optics/transform";
import { MAX_SEGMENTS } from "@/lib/math/constants";
import { degToRad, normalizeAngle, radToDeg } from "@/lib/math/angles";
import { scale, sub } from "@/lib/math/vec2";
import type { LightSourceConfig, PrismConfig } from "@/types/optics";
import { circle, scene, source } from "./scenes";

const PRISM: PrismConfig = {
  id: "P1",
  center: { x: 400, y: 300 },
  circumradius: 56,
  orientationDeg: 30,
  spreadDeg: 12,
};

function coloredSource(color: { r: number; g: number; b: number }): LightSourceConfig {
  return { ...source("S1", { x: 120, y: 300 }), color };
}

function headingsFromSegments(result: ReturnType<typeof solveOptics>): number[] {
  return result.segments
    .filter((segment) => segment.kind === "beam" && segment.bounce > 0)
    .map((segment) => {
      const dx = segment.b.x - segment.a.x;
      const dy = segment.b.y - segment.a.y;
      return normalizeAngle(radToDeg(Math.atan2(dy, dx)));
    });
}

describe("optics/prism — simplified dispersion (TC-F04, F05, G07, X05)", () => {
  it("TC-F04/G07: splits white light into headings φ−Δ, φ, φ+Δ", () => {
    const result = solveOptics(scene({ sources: [source("S1", { x: 120, y: 300 })], prisms: [PRISM] }));
    const prismEvents = result.events.filter((event) => event.type === "prism");
    const interior = result.segments.filter((segment) => segment.kind === "prismInterior");
    expect(prismEvents).toHaveLength(1);
    expect(interior).toHaveLength(1);
    expect(headingsFromSegments(result)).toEqual([348, 0, 12]);
    const colors = result.segments
      .filter((segment) => segment.kind === "beam" && segment.bounce > 0)
      .map((segment) => segment.color);
    const expectedColors = [
      { r: 1, g: 0, b: 0 },
      { r: 0, g: 1, b: 0 },
      { r: 0, g: 0, b: 1 },
    ];
    expectedColors.forEach((expected, index) => {
      for (const channel of ["r", "g", "b"] as const) {
        expect(colors[index][channel]).toBeCloseTo(expected[channel], 6);
      }
    });
  });

  it("TC-F05: a single-channel ray passes straight with transmittance loss", () => {
    const result = solveOptics(scene({ sources: [coloredSource({ r: 1, g: 0, b: 0 })], prisms: [PRISM] }));
    const outgoing = result.segments.filter((segment) => segment.kind === "beam" && segment.bounce > 0);
    expect(outgoing).toHaveLength(1);
    expect(headingsFromSegments(result)).toEqual([0]);
    expect(outgoing[0].intensity).toBeCloseTo(gameConfig.optics.prismTransmittance, 9);
    expect(outgoing[0].color).toEqual({ r: 1, g: 0, b: 0 });
  });

  it("does not create a fan when the ray only grazes a prism vertex", () => {
    // Approach the upper-left vertex along 60°: continuation lies outside both adjacent faces.
    const vertex = getPrismVertices(PRISM)[1];
    const direction = { x: Math.cos(degToRad(60)), y: Math.sin(degToRad(60)) };
    const grazingSource = source("S1", sub(vertex, scale(direction, 200)), 60);
    const result = solveOptics(scene({ sources: [grazingSource], prisms: [PRISM] }));
    expect(result.segments.some((segment) => segment.kind === "prismInterior")).toBe(false);
    expect(result.segments.filter((segment) => segment.kind === "beam" && segment.bounce > 0)).toHaveLength(0);
    expect(result.stats.terminated.prism).toBe(1);
  });

  it("TC-X05: two sources produce independent fans within the segment cap", () => {
    const second = { ...PRISM, id: "P2", center: { x: 400, y: 500 } };
    const result = solveOptics(
      scene({
        sources: [source("S1", { x: 120, y: 300 }), source("S2", { x: 120, y: 500 })],
        prisms: [PRISM, second],
        circles: [circle("T1", "target", { x: 1100, y: 300 }), circle("T2", "target", { x: 1100, y: 500 })],
      }),
    );
    expect(result.events.filter((event) => event.type === "prism")).toHaveLength(2);
    expect(result.segments.filter((segment) => segment.kind === "prismInterior")).toHaveLength(2);
    expect(result.segments.filter((segment) => segment.kind === "beam" && segment.bounce > 0)).toHaveLength(6);
    expect(result.stats.segmentCount).toBeLessThanOrEqual(MAX_SEGMENTS);
  });
});
