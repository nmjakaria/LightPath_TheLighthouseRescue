import { describe, expect, it } from "vitest";
import { degToRad } from "@/lib/math/angles";
import { EPS_U } from "@/lib/math/constants";
import {
  add,
  cross,
  dot,
  headingToVec,
  length,
  lengthSq,
  normalize,
  rotate,
  scale,
  sub,
} from "@/lib/math/vec2";

describe("vec2", () => {
  it("adds, subtracts and scales component-wise", () => {
    const a = { x: 3, y: -4 };
    const b = { x: -1, y: 2 };
    expect(add(a, b)).toEqual({ x: 2, y: -2 });
    expect(sub(a, b)).toEqual({ x: 4, y: -6 });
    expect(scale(a, 2.5)).toEqual({ x: 7.5, y: -10 });
  });

  it("computes dot and scalar cross products", () => {
    expect(dot({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(0);
    expect(dot({ x: 2, y: 3 }, { x: 4, y: 5 })).toBe(23);
    expect(cross({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1);
    expect(cross({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(-1);
  });

  it("computes squared length and length", () => {
    expect(lengthSq({ x: 3, y: 4 })).toBe(25);
    expect(length({ x: 3, y: 4 })).toBe(5);
  });

  it("normalizes to unit length and maps the zero vector to a finite zero vector", () => {
    const unit = normalize({ x: 3, y: 4 });
    expect(unit.x).toBeCloseTo(0.6, 12);
    expect(unit.y).toBeCloseTo(0.8, 12);
    expect(length(unit)).toBeCloseTo(1, 12);

    const zero = normalize({ x: 0, y: 0 });
    expect(zero).toEqual({ x: 0, y: 0 });
    expect(Number.isNaN(zero.x) || Number.isNaN(zero.y)).toBe(false);
  });

  it("rotates clockwise on screen and converts headings", () => {
    const east = { x: 1, y: 0 };
    const down = rotate(east, degToRad(90));
    expect(down.x).toBeCloseTo(0, 12);
    expect(down.y).toBeCloseTo(1, 12);

    const up = headingToVec(-90);
    expect(up.x).toBeCloseTo(0, 12);
    expect(up.y).toBeCloseTo(-1, 12);

    const west = headingToVec(180);
    expect(west.x).toBeCloseTo(-1, 12);
    expect(Math.abs(west.y)).toBeLessThan(EPS_U);
  });
});
