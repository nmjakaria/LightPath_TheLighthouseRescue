import { describe, expect, it } from "vitest";
import { degToRad } from "@/lib/math/angles";
import {
  apply,
  IDENTITY,
  invert,
  multiply,
  rotate,
  rotateAboutPivot,
  scale,
  translate,
  type Mat3,
} from "@/lib/math/mat3";

function expectPointClose(actual: { x: number; y: number }, x: number, y: number): void {
  expect(actual.x).toBeCloseTo(x, 10);
  expect(actual.y).toBeCloseTo(y, 10);
}

describe("mat3", () => {
  it("leaves points unchanged under the identity transform", () => {
    expectPointClose(apply(IDENTITY, { x: -2, y: 7 }), -2, 7);
  });

  it("applies translate, scale and rotate with y-down clockwise rotation", () => {
    expectPointClose(apply(translate(10, -5), { x: 1, y: 2 }), 11, -3);
    expectPointClose(apply(scale(2, 0.5), { x: 3, y: 8 }), 6, 4);
    expectPointClose(apply(rotate(degToRad(90)), { x: 1, y: 0 }), 0, 1);
  });

  it("multiplies matrices so the right-hand transform is applied first", () => {
    const composed = multiply(translate(10, 0), scale(2, 2));
    expectPointClose(apply(composed, { x: 3, y: 4 }), 16, 8);
  });

  it("inverts an affine transform and a general non-singular matrix", () => {
    const affine = multiply(translate(5, -2), rotate(degToRad(90)));
    const affineInverse = invert(affine);
    expect(affineInverse).not.toBeNull();
    expectPointClose(apply(affine, { x: 3, y: 4 }), 1, 1);
    if (affineInverse) expectPointClose(apply(affineInverse, { x: 1, y: 1 }), 3, 4);

    const general: Mat3 = [2, 1, 0, 1, 3, 0, 0, 0, 1];
    const generalInverse = invert(general);
    expect(generalInverse).not.toBeNull();
    if (generalInverse) {
      const forward = apply(general, { x: 1, y: -2 });
      expectPointClose(apply(generalInverse, forward), 1, -2);
    }
  });

  it("returns null for a singular matrix", () => {
    expect(invert([1, 2, 3, 2, 4, 6, 0, 0, 1])).toBeNull();
  });

  it("rotates a point about a pivot using the T(c) R T(-c) oracle", () => {
    const pivot = { x: 1, y: 0 };
    const quarterTurn = rotateAboutPivot(pivot, degToRad(90));
    expectPointClose(apply(quarterTurn, { x: 2, y: 0 }), 1, 1);

    const halfTurn = rotateAboutPivot({ x: 1, y: 1 }, degToRad(180));
    expectPointClose(apply(halfTurn, { x: 3, y: 2 }), -1, 0);
  });

  it("divides by the homogeneous w component and rejects a zero w", () => {
    expectPointClose(apply([2, 0, 0, 0, 2, 0, 0, 0, 2], { x: 3, y: 4 }), 3, 4);
    expectPointClose(apply([1, 0, 5, 0, 1, 5, 0, 0, 0], { x: 1, y: 1 }), 0, 0);
  });
});
