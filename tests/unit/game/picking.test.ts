import { describe, expect, it } from "vitest";
import { pickMirror, pointerAngle } from "@/game/picking";
import { level01 } from "@/levels/level-01";

describe("canvas picking", () => {
  it("selects a mirror along its drawn segment, including near an endpoint", () => {
    expect(pickMirror({ x: 500, y: 560 }, level01.mirrors)).toBe("M1");
    expect(pickMirror({ x: 500, y: 512 }, level01.mirrors)).toBe("M1");
    expect(pickMirror({ x: 500, y: 260 }, level01.mirrors)).toBe("M2");
  });

  it("deselects on empty space but still picks locked mirrors for feedback", () => {
    expect(pickMirror({ x: 700, y: 500 }, level01.mirrors)).toBeNull();
    const locked = level01.mirrors.map((mirror) => ({ ...mirror, rotatable: false }));
    expect(pickMirror({ x: 500, y: 560 }, locked)).toBe("M1");
  });

  it("computes pointer headings in screen coordinates", () => {
    expect(pointerAngle({ x: 600, y: 560 }, { x: 500, y: 560 })).toBeCloseTo(0, 9);
    expect(pointerAngle({ x: 500, y: 660 }, { x: 500, y: 560 })).toBeCloseTo(90, 9);
    expect(pointerAngle({ x: 400, y: 560 }, { x: 500, y: 560 })).toBeCloseTo(180, 9);
  });
});
