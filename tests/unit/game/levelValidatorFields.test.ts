import { describe, expect, it } from "vitest";
import {
  array,
  choice,
  checkIds,
  error,
  isRecord,
  number,
  point,
  text,
  validateGates,
  validateMirrors,
  validateMovable,
  validateObstacles,
  validatePrisms,
  validateSolution,
  validateSources,
  validateSwitches,
  validateTargets,
  validateTextArray,
  validateTutorials,
  validateVertices,
} from "@/game/levelValidatorFields";
import type { IssueList } from "@/game/validationTypes";

const errors = (): IssueList => [];
const messages = (issues: IssueList): string[] => issues.map((issue) => issue.message);

describe("level validator primitives (FR-012, TC-E08)", () => {
  it("distinguishes records from arrays and primitives and records readable issues", () => {
    expect(isRecord({ id: "A" })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord(7)).toBe(false);
    const issues = errors();
    error(issues, "a.b", "broken");
    expect(issues).toEqual([{ path: "a.b", message: "broken" }]);
  });

  it("validates text, numbers, points, arrays and choices with explicit fallbacks", () => {
    const source = { text: "ok", empty: "", count: 3, bad: NaN, low: -1, choice: "x" };
    const issues = errors();
    expect(text(source, "text", "root", issues)).toBe("ok");
    expect(text(source, "empty", "root", issues)).toBeNull();
    expect(text(source, "missing", "root", issues)).toBeNull();
    expect(number(source, "count", "root", issues)).toBe(3);
    expect(number(source, "count", "root", issues, 0)).toBe(3);
    expect(number(source, "bad", "root", issues)).toBeNull();
    expect(number(source, "low", "root", issues, 0)).toBeNull();
    expect(number(source, "missing", "root", issues)).toBeNull();
    expect(point({ x: 1, y: 2 }, "p", issues)).toEqual({ x: 1, y: 2 });
    expect(point({ y: 2 }, "p", issues)).toBeNull();
    expect(point({ x: 1 }, "p", issues)).toBeNull();
    expect(point(42, "p", issues)).toBeNull();
    expect(array(source, "missing", issues)).toEqual([]);
    expect(array({ list: [1] }, "list", issues)).toEqual([1]);
    expect(choice(source, "choice", "root", ["x", "y"] as const, issues)).toBe("x");
    expect(choice(source, "missing", "root", ["x"] as const, issues)).toBeNull();
    expect(choice(source, "choice", "root", ["y"] as const, issues)).toBeNull();
    expect(messages(issues)).toContain("must be a non-empty string");
    expect(messages(issues)).toContain("must be a finite number >= -Infinity");
    expect(messages(issues)).toContain("must be an array");
    expect(messages(issues)).toContain("must be one of y");
  });
});

describe("component field validators report every malformed value", () => {
  it("checks ids, duplicates and non-object entries", () => {
    const issues = errors();
    checkIds([42, {}, { id: "A" }, { id: "A" }], "mirrors", issues, new Set());
    expect(messages(issues)).toEqual([
      "must be an object",
      "must be a non-empty string",
      'duplicate component id "A"',
    ]);
  });

  it("checks sources including RGB bounds and optional housing radius", () => {
    const issues = errors();
    validateSources(
      [
        42,
        {
          position: 7,
          headingDeg: NaN,
          intensity: -1,
          rotatable: "yes",
          housingRadius: -1,
          color: 5,
        },
      ],
      issues,
    );
    expect(messages(issues)).toContain("must be an RGB object");
    expect(messages(issues)).toContain("must be a boolean");
    const full = errors();
    validateSources(
      [
        {
          position: { x: 1, y: 2 },
          headingDeg: 0,
          intensity: 1,
          rotatable: true,
          housingRadius: 8,
          color: { r: 1.5, g: -0.2, b: 0.5 },
        },
      ],
      full,
    );
    expect(messages(full)).toEqual(["must be between 0 and 1", "must be between 0 and 1"]);
  });

  it("checks mirrors, prisms, obstacles and vertices", () => {
    const issues = errors();
    validateMirrors([42, { center: { x: 0 }, angleDeg: "x", length: -1, rotatable: 0 }], issues);
    validatePrisms(
      [42, { center: null, circumradius: -1, orientationDeg: "x", spreadDeg: -1 }],
      issues,
    );
    validateObstacles([42, { vertices: [] }], issues);
    expect(validateVertices(undefined, "v", issues)).toEqual([]);
    expect(validateVertices([{ x: 1, y: 2 }, 42], "v", issues)).toHaveLength(1);
    expect(messages(issues)).toContain("must be a non-empty array of points");
    expect(messages(issues)).toContain("must be an object");
    expect(messages(issues)).toContain("must be a point with finite x and y");
  });

  it("checks movable obstacle rails and range ordering", () => {
    const issues = errors();
    validateMovable(
      [
        42,
        {
          localVertices: [],
          start: null,
          axis: "z",
          snap: -1,
          range: [5, 1],
        },
        { range: "bad" },
        { range: ["a", 2] },
        { range: [NaN, 2] },
      ],
      issues,
    );
    expect(messages(issues)).toContain("must be [min, max]");
    expect(messages(issues)).toContain("must be two ordered finite numbers");
    const valid = errors();
    validateMovable(
      [
        {
          localVertices: [{ x: 0, y: 0 }],
          start: { x: 1, y: 2 },
          axis: "x",
          snap: 20,
          range: [0, 10],
        },
      ],
      valid,
    );
    expect(valid).toEqual([]);
  });

  it("checks switches, gates, targets, tutorials, hints and solution steps", () => {
    const issues = errors();
    validateSwitches([42, { center: 1, radius: -1, requires: "pink", gateId: "" }], issues);
    validateGates([42, { a: 1, b: 2, thickness: -1 }], issues);
    validateTargets([42, { center: 1, radius: -1, requires: "pink", required: "yes" }], issues);
    validateTutorials([42, { id: "", text: 1, trigger: "later" }], issues);
    validateTextArray([42, { text: "" }], "hints", issues);
    validateSolution(
      [
        42,
        {},
        {
          componentId: "MISSING",
          angleDeg: "bad",
          position: { x: 1 },
        },
      ],
      new Set(["M1"]),
      issues,
    );
    expect(messages(issues)).toContain('unknown component "MISSING"');
    expect(messages(issues)).toContain("needs angleDeg or position");
    expect(messages(issues)).toContain("must be an object");
    const valid = errors();
    validateSolution(
      [
        { componentId: "M1", angleDeg: 45 },
        { componentId: "M1", position: { x: 1, y: 2 } },
      ],
      new Set(["M1"]),
      valid,
    );
    expect(valid).toEqual([]);
  });
});
