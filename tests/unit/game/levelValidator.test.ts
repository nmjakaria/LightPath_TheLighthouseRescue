import { describe, expect, it } from "vitest";
import { validateLevel } from "@/game/levelValidator";
import { level01 } from "@/levels/level-01";
import { level04 } from "@/levels/level-04";

function messages(path: string): string[] {
  return validateLevel(path === "bad-gate" ? badGate() : level01).errors.map((issue) => issue.message);
}

function badGate(): unknown {
  return {
    ...level04,
    switches: level04.switches.map((input) => ({ ...input, gateId: "G99" })),
  };
}

describe("level validation (FR-012, TC-E08)", () => {
  it("accepts the authored reference level", () => {
    const result = validateLevel(level01);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects non-objects with a readable reason", () => {
    const result = validateLevel(42);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("must be an object");
  });

  it("rejects a level with no required target", () => {
    const level = { ...level01, targets: level01.targets.map((target) => ({ ...target, required: false })) };
    expect(validateLevel(level).errors.some((issue) => issue.message.includes("required"))).toBe(true);
  });

  it("rejects NaN angles and duplicate ids", () => {
    const nan = {
      ...level01,
      mirrors: [{ ...level01.mirrors[0], angleDeg: Number.NaN }, level01.mirrors[1]],
    };
    const duplicate = {
      ...level01,
      mirrors: [level01.mirrors[0], { ...level01.mirrors[1], id: "M1" }],
    };
    expect(validateLevel(nan).errors.some((issue) => issue.path.endsWith("angleDeg"))).toBe(true);
    expect(validateLevel(duplicate).errors.some((issue) => issue.message.includes("duplicate"))).toBe(true);
  });

  it("rejects a switch whose gate link does not resolve", () => {
    expect(messages("bad-gate").some((message) => message.includes("unknown gate"))).toBe(true);
  });

  it("warns about overlapping components without blocking play", () => {
    const level = {
      ...level01,
      mirrors: [level01.mirrors[0], { ...level01.mirrors[1], center: { ...level01.mirrors[0].center } }],
    };
    const result = validateLevel(level);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((warning) => warning.message.includes("overlap"))).toBe(true);
  });
});
