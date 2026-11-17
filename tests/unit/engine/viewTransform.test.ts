import { describe, expect, it } from "vitest";
import { ViewTransform } from "@/engine/core/ViewTransform";

function closeTo(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThan(1e-9);
}

describe("ViewTransform", () => {
  it("fits the 16:9 world exactly at native size", () => {
    const view = new ViewTransform();
    view.resize(1280, 720, 1);
    closeTo(view.getScale(), 1);
    expect(view.getOffset()).toEqual({ x: 0, y: 0 });
    expect(view.toScreen({ x: 640, y: 360 })).toEqual({ x: 640, y: 360 });
    expect(view.getDeviceSize()).toEqual({ width: 1280, height: 720 });
  });

  it("scales uniformly at half and twice the size", () => {
    const half = new ViewTransform();
    half.resize(640, 360, 1);
    closeTo(half.getScale(), 0.5);
    expect(half.toScreen({ x: 1000, y: 260 })).toEqual({ x: 500, y: 130 });

    const double = new ViewTransform();
    double.resize(2560, 1440, 1);
    closeTo(double.getScale(), 2);
    expect(double.toScreen({ x: 1000, y: 260 })).toEqual({ x: 2000, y: 520 });
  });

  it("letterboxes a non-16:9 viewport", () => {
    const view = new ViewTransform();
    view.resize(1000, 1000, 1);
    closeTo(view.getScale(), 0.78125);
    const offset = view.getOffset();
    closeTo(offset.x, 0);
    closeTo(offset.y, 218.75);
    expect(view.toScreen({ x: 0, y: 0 })).toEqual({ x: 0, y: 218.75 });
  });

  it("inverts pointer CSS coordinates back to world units at every zoom level", () => {
    for (const [width, height] of [
      [640, 360],
      [1280, 720],
      [2560, 1440],
      [900, 1200],
    ]) {
      const view = new ViewTransform();
      view.resize(width, height, 3);
      const world = { x: 500, y: 260 };
      const cssPoint = view.toScreen(world);
      const restored = view.toWorld(cssPoint);
      closeTo(restored.x, world.x);
      closeTo(restored.y, world.y);
    }
  });

  it("caps device pixel ratio at the configured maximum", () => {
    const view = new ViewTransform();
    view.resize(640, 360, 3);
    expect(view.getDpr()).toBe(2);
    expect(view.getDeviceSize()).toEqual({ width: 1280, height: 720 });
    expect(view.getDeviceTransform()).toEqual([1, 0, 0, 1, 0, 0]);

    view.resize(640, 360, 0);
    expect(view.getDpr()).toBe(1);
    expect(view.getDeviceSize()).toEqual({ width: 640, height: 360 });
  });

  it("does not divide by zero before the first resize", () => {
    const view = new ViewTransform();
    expect(view.toWorld({ x: 10, y: 10 })).toEqual({ x: 0, y: 0 });
    view.resize(0, 0, 1);
    expect(view.getScale()).toBe(0);
    expect(view.toWorld({ x: 10, y: 10 })).toEqual({ x: 0, y: 0 });
  });
});
