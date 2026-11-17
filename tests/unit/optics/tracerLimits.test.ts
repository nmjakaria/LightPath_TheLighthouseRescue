import { describe, expect, it } from "vitest";
import { MAX_BOUNCES, MAX_SEGMENTS, MIN_INTENSITY } from "@/lib/math/constants";
import { solveOptics } from "@/engine/optics/tracer";
import { facingMirrorScene, fourMirrorScene, mirror, scene, source } from "./scenes";

describe("optics/tracer termination limits", () => {
  it("TC-X01: stops at the 160-segment cap without throwing", () => {
    const sources = Array.from({ length: 60 }, (_, index) =>
      source(`S${index}`, { x: 500, y: 80 + index * 9 }),
    );
    const result = solveOptics(
      scene({
        sources,
        mirrors: [
          mirror("A", { x: 400, y: 360 }, 90, 600),
          mirror("B", { x: 600, y: 360 }, 90, 600),
        ],
      }),
    );
    expect(result.stats.segmentCount).toBe(MAX_SEGMENTS);
    expect(result.segments).toHaveLength(MAX_SEGMENTS);
    expect(result.stats.terminated.segmentCap).toBeGreaterThanOrEqual(1);
  });

  it("TC-X02: ends a low-intensity path before it drops below MIN_INTENSITY", () => {
    const result = solveOptics(
      scene({
        sources: [source("S1", { x: 100, y: 600 }, 0, 0.06)],
        mirrors: [
          mirror("M1", { x: 300, y: 600 }, 135),
          mirror("M2", { x: 300, y: 300 }, 135),
          mirror("M3", { x: 600, y: 300 }, 135),
          mirror("M4", { x: 600, y: 150 }, 135),
          mirror("M5", { x: 900, y: 150 }, 135),
          mirror("M6", { x: 900, y: 100 }, 135),
        ],
      }),
    );
    expect(result.stats.terminated.intensity).toBe(1);
    expect(result.segments).toHaveLength(4);
    expect(result.segments[3].intensity).toBeGreaterThan(MIN_INTENSITY);
  });

  it("TC-X04: terminates a looping path on the first repeated state", () => {
    const result = solveOptics(facingMirrorScene());
    expect(result.stats.terminated.repeat).toBe(1);
    expect(result.stats.maxBounce).toBeLessThan(MAX_BOUNCES);
  });

  it("TC-X07: facing mirrors terminate quickly within the bounce cap", () => {
    const started = performance.now();
    const result = solveOptics(facingMirrorScene());
    const elapsed = performance.now() - started;
    expect(result.segments.length).toBeGreaterThan(2);
    expect(result.stats.maxBounce).toBeLessThanOrEqual(MAX_BOUNCES);
    expect(elapsed).toBeLessThan(5);
  });

  it("TC-X08: 1000 solves of one state produce identical segment lists", () => {
    const input = fourMirrorScene();
    const reference = JSON.stringify(solveOptics(input).segments);
    for (let index = 0; index < 1000; index += 1) {
      expect(JSON.stringify(solveOptics(input).segments)).toBe(reference);
    }
  });

  it("TC-G06: traces a four-bounce chain through reference hit points", () => {
    const result = solveOptics(fourMirrorScene());
    expect(result.stats.segmentCount).toBe(5);
    expect(result.stats.maxBounce).toBe(4);
    expect(result.events.map((event) => event.objectId)).toEqual([
      "M1", "M2", "M3", "M4", "T1",
    ]);
    const expected = [
      { x: 400, y: 600 }, { x: 400, y: 300 }, { x: 800, y: 300 },
      { x: 800, y: 150 }, { x: 972, y: 150 },
    ];
    result.events.forEach((event, index) => {
      expect(event.point.x).toBeCloseTo(expected[index].x, 0);
      expect(event.point.y).toBeCloseTo(expected[index].y, 0);
    });
    expect(result.stats.terminated.target).toBe(1);
  });
});
