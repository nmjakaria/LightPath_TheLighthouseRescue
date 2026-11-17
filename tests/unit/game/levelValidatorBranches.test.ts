import { describe, expect, it } from "vitest";
import { validateLevel } from "@/game/levelValidator";
import { spreadComponents, warnSpacing } from "@/game/levelValidatorSpacing";
import type { IssueList } from "@/game/validationTypes";
import { level01 } from "@/levels/level-01";

const messages = (issues: IssueList): string[] => issues.map((issue) => issue.message);

describe("level validator top-level branches (FR-012, TC-E08)", () => {
  it("collects header, field, link and required-target errors in one pass", () => {
    const result = validateLevel({
      ...level01,
      index: 1.5,
      par: 42,
      rotationStepDeg: "x",
      celebrationSec: -1,
      sources: "missing",
      mirrors: [42, {}, { id: "M1", center: { x: 0 } }],
      switches: [
        {
          id: "SW",
          center: { x: 1, y: 2 },
          radius: 24,
          requires: "any",
          gateId: "G99",
        },
      ],
      targets: [{ ...level01.targets[0], required: false }],
    });
    expect(result.valid).toBe(false);
    for (const expected of [
      "must be an integer",
      "must be an object",
      "must be an array",
      "must be a non-empty string",
      'unknown gate "G99"',
      "at least one target must be required",
    ]) {
      expect(messages(result.errors)).toContain(expected);
    }
  });

  it("accepts optional header fields when they are valid", () => {
    const result = validateLevel({
      ...level01,
      rotationStepDeg: 15,
      celebrationSec: 0.6,
    });
    expect(result.errors).toEqual([]);
  });

  it("reports overlapping rotation sweeps as warnings, never blocking errors", () => {
    const result = validateLevel({
      ...level01,
      mirrors: [
        { ...level01.mirrors[0], center: { x: 100, y: 100 } },
        { ...level01.mirrors[1], center: { x: 110, y: 100 } },
      ],
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings[0].message).toContain("overlap");
    expect(result.valid).toBe(true);
  });
});

describe("spacing helper edge cases (PRD §13.1)", () => {
  it("ignores malformed components and filters to known ids", () => {
    const found = spreadComponents(
      {
        mirrors: [
          42,
          { id: null, center: { x: 0, y: 0 }, length: 96 },
          { id: "M", center: 5, length: 96 },
          { id: "M2", center: { x: 0, y: 0 }, length: NaN },
          { id: "M3", center: { x: 10, y: 10 }, length: 96 },
        ],
        sources: [
          42,
          { id: "S", position: 7 },
          { id: "S2", position: { x: 20, y: 20 }, housingRadius: 12 },
          { id: "S3", position: { x: 30, y: 30 } },
        ],
        targets: [
          42,
          { id: "T", center: 5, radius: 28 },
          { id: "T2", center: { x: 40, y: 40 }, radius: 28 },
        ],
        switches: [
          42,
          { id: "SW", center: 5, radius: 24 },
          { id: "SW2", center: { x: 50, y: 50 }, radius: 24 },
        ],
        prisms: [
          42,
          { id: "P", center: 5, circumradius: 30 },
          { id: "P2", center: { x: 60, y: 60 }, circumradius: 30 },
        ],
      },
      ["M3", "S2", "S3", "T2", "SW2", "P2"],
    );
    expect(found.map((component) => component.id)).toEqual(["M3", "S2", "S3", "T2", "SW2", "P2"]);
    expect(found.find((component) => component.id === "S3")?.radius).toBe(16);
    expect(found.find((component) => component.id === "S2")?.radius).toBe(12);
  });

  it("warns only when two rotation sweeps actually touch", () => {
    const warnings: IssueList = [];
    warnSpacing(
      [
        { id: "A", center: { x: 0, y: 0 }, radius: 10 },
        { id: "B", center: { x: 100, y: 0 }, radius: 10 },
      ],
      warnings,
    );
    expect(warnings).toEqual([]);
    warnSpacing(
      [
        { id: "A", center: { x: 0, y: 0 }, radius: 10 },
        { id: "B", center: { x: 15, y: 0 }, radius: 10 },
      ],
      warnings,
    );
    expect(warnings).toEqual([
      { path: "A/B", message: "components overlap or their rotation sweeps touch" },
    ]);
  });
});
