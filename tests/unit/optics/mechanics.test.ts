import { describe, expect, it } from "vitest";
import { solveOptics } from "@/engine/optics/tracer";
import type { ObstacleConfig } from "@/types/optics";
import { circle, scene, source } from "./scenes";

const WALL: ObstacleConfig = {
  id: "W1",
  vertices: [
    { x: 400, y: 260 },
    { x: 400, y: 340 },
  ],
};

const CORNER: ObstacleConfig = {
  id: "W2",
  vertices: [
    { x: 300, y: 300 },
    { x: 340, y: 300 },
    { x: 340, y: 340 },
    { x: 300, y: 340 },
  ],
};

describe("optics obstacles (TC-F07, TC-G05, TC-E04)", () => {
  it("TC-F07/E04: an opaque wall ends the beam with no segment beyond it", () => {
    const result = solveOptics(
      scene({
        sources: [source("S1", { x: 120, y: 300 })],
        obstacles: [WALL],
        circles: [circle("T1", "target", { x: 800, y: 300 }, 28)],
      }),
    );
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].b.x).toBeCloseTo(400, 6);
    expect(result.segments[0].b.y).toBeCloseTo(300, 6);
    expect(result.events.map((event) => event.objectId)).toEqual(["W1"]);
    expect(result.stats.terminated.obstacle).toBe(1);
  });

  it("TC-G05: a beam aimed exactly at a polygon corner stops there without leaking", () => {
    const result = solveOptics(
      scene({
        sources: [source("S1", { x: 100, y: 100 }, 45)],
        obstacles: [CORNER],
        circles: [circle("T1", "target", { x: 500, y: 500 }, 28)],
      }),
    );
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].b.x).toBeCloseTo(300, 6);
    expect(result.segments[0].b.y).toBeCloseTo(300, 6);
    expect(result.events[0].objectId).toBe("W2");
    expect(result.stats.terminated.obstacle).toBe(1);
  });

  it("a gate only blocks while its open fraction is below the solver threshold", () => {
    const closed = solveOptics(
      scene({
        sources: [source("S1", { x: 120, y: 300 })],
        gates: [{ id: "G1", a: { x: 400, y: 260 }, b: { x: 400, y: 340 }, openFraction: 0.49 }],
      }),
    );
    const open = solveOptics(
      scene({
        sources: [source("S1", { x: 120, y: 300 })],
        gates: [{ id: "G1", a: { x: 400, y: 260 }, b: { x: 400, y: 340 }, openFraction: 0.5 }],
      }),
    );
    expect(closed.events[0].objectId).toBe("G1");
    expect(open.events[0].type).toBe("boundary");
  });
});
