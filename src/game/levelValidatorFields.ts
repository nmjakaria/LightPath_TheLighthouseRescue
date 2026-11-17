/*
 * Field-level checks for PRD FR-012. Each helper reports readable issues instead of throwing, and
 * returns whatever valid data it could recover so validation can continue collecting problems.
 */
import type { Vec2 } from "@/types/vec2";
import type { IssueList, UnknownRecord } from "./validationTypes";

const TRIGGERS = ["start", "firstRotate", "firstPrismHit", "gateSeen"] as const;
const DIFFICULTIES = ["tutorial", "easy", "medium", "hard"] as const;
const COLORS = ["any", "red", "green", "blue"] as const;

export { TRIGGERS, DIFFICULTIES, COLORS };

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function error(errors: IssueList, path: string, message: string): void {
  errors.push({ path, message });
}

export function text(source: UnknownRecord, key: string, path: string, errors: IssueList): string | null {
  const value = source[key];
  if (typeof value !== "string" || value.length === 0) {
    error(errors, `${path}.${key}`, "must be a non-empty string");
    return null;
  }
  return value;
}

export function number(
  source: UnknownRecord,
  key: string,
  path: string,
  errors: IssueList,
  min = Number.NEGATIVE_INFINITY,
): number | null {
  const value = source[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
    error(errors, `${path}.${key}`, `must be a finite number >= ${min}`);
    return null;
  }
  return value;
}

export function point(value: unknown, path: string, errors: IssueList): Vec2 | null {
  if (!isRecord(value)) {
    error(errors, path, "must be a point with finite x and y");
    return null;
  }
  const x = number(value, "x", path, errors);
  const y = number(value, "y", path, errors);
  return x === null || y === null ? null : { x, y };
}

export function array(source: UnknownRecord, key: string, errors: IssueList): unknown[] {
  const value = source[key];
  if (!Array.isArray(value)) {
    error(errors, key, "must be an array");
    return [];
  }
  return value;
}

export function choice<T extends string>(
  source: UnknownRecord,
  key: string,
  path: string,
  options: readonly T[],
  errors: IssueList,
): T | null {
  const value = source[key];
  if (typeof value !== "string" || !options.includes(value as T)) {
    error(errors, `${path}.${key}`, `must be one of ${options.join(", ")}`);
    return null;
  }
  return value as T;
}

export function checkIds(items: readonly unknown[], label: string, errors: IssueList, seen: Set<string>): void {
  items.forEach((item, index) => {
    if (!isRecord(item)) {
      error(errors, `${label}[${index}]`, "must be an object");
      return;
    }
    const id = text(item, "id", `${label}[${index}]`, errors);
    if (id === null) return;
    if (seen.has(id)) error(errors, `${label}[${index}].id`, `duplicate component id "${id}"`);
    seen.add(id);
  });
}

export function validateSources(sources: readonly unknown[], errors: IssueList): void {
  sources.forEach((item, index) => {
    const path = `sources[${index}]`;
    if (!isRecord(item)) return error(errors, path, "must be an object");
    point(item.position, `${path}.position`, errors);
    number(item, "headingDeg", path, errors);
    number(item, "intensity", path, errors, 0);
    if (typeof item.rotatable !== "boolean") error(errors, `${path}.rotatable`, "must be a boolean");
    if (item.housingRadius !== undefined) number(item, "housingRadius", path, errors, 0);
    if (!isRecord(item.color)) return error(errors, `${path}.color`, "must be an RGB object");
    for (const channel of ["r", "g", "b"] as const) {
      const value = number(item.color, channel, `${path}.color`, errors);
      if (value !== null && (value < 0 || value > 1)) error(errors, `${path}.color.${channel}`, "must be between 0 and 1");
    }
  });
}

export function validateMirrors(mirrors: readonly unknown[], errors: IssueList): void {
  mirrors.forEach((item, index) => {
    const path = `mirrors[${index}]`;
    if (!isRecord(item)) return error(errors, path, "must be an object");
    point(item.center, `${path}.center`, errors);
    number(item, "angleDeg", path, errors);
    number(item, "length", path, errors, 0);
    if (typeof item.rotatable !== "boolean") error(errors, `${path}.rotatable`, "must be a boolean");
  });
}

export function validatePrisms(prisms: readonly unknown[], errors: IssueList): void {
  prisms.forEach((item, index) => {
    const path = `prisms[${index}]`;
    if (!isRecord(item)) return error(errors, path, "must be an object");
    point(item.center, `${path}.center`, errors);
    number(item, "circumradius", path, errors, 0);
    number(item, "orientationDeg", path, errors);
    number(item, "spreadDeg", path, errors, 0);
  });
}

function isPoint(value: Vec2 | null): value is Vec2 {
  return value !== null;
}

export function validateVertices(value: unknown, path: string, errors: IssueList): Vec2[] {
  if (!Array.isArray(value) || value.length === 0) {
    error(errors, path, "must be a non-empty array of points");
    return [];
  }
  return value.map((vertex, index) => point(vertex, `${path}[${index}]`, errors)).filter(isPoint);
}

export function validateObstacles(obstacles: readonly unknown[], errors: IssueList): void {
  obstacles.forEach((item, index) => {
    const path = `obstacles[${index}]`;
    if (!isRecord(item)) return error(errors, path, "must be an object");
    validateVertices(item.vertices, `${path}.vertices`, errors);
  });
}

export function validateMovable(obstacles: readonly unknown[], errors: IssueList): void {
  obstacles.forEach((item, index) => {
    const path = `movableObstacles[${index}]`;
    if (!isRecord(item)) return error(errors, path, "must be an object");
    validateVertices(item.localVertices, `${path}.localVertices`, errors);
    point(item.start, `${path}.start`, errors);
    choice(item, "axis", path, ["x", "y"], errors);
    number(item, "snap", path, errors, 0);
    if (!Array.isArray(item.range) || item.range.length !== 2) {
      error(errors, `${path}.range`, "must be [min, max]");
      return;
    }
    const [min, max] = item.range;
    if (typeof min !== "number" || typeof max !== "number" || !Number.isFinite(min) || !Number.isFinite(max) || min > max) {
      error(errors, `${path}.range`, "must be two ordered finite numbers");
    }
  });
}

export function validateSwitches(switches: readonly unknown[], errors: IssueList): void {
  switches.forEach((item, index) => {
    const path = `switches[${index}]`;
    if (!isRecord(item)) return error(errors, path, "must be an object");
    point(item.center, `${path}.center`, errors);
    number(item, "radius", path, errors, 0);
    choice(item, "requires", path, COLORS, errors);
    text(item, "gateId", path, errors);
  });
}

export function validateGates(gates: readonly unknown[], errors: IssueList): void {
  gates.forEach((item, index) => {
    const path = `gates[${index}]`;
    if (!isRecord(item)) return error(errors, path, "must be an object");
    point(item.a, `${path}.a`, errors);
    point(item.b, `${path}.b`, errors);
    number(item, "thickness", path, errors, 0);
  });
}

export function validateTargets(targets: readonly unknown[], errors: IssueList): void {
  targets.forEach((item, index) => {
    const path = `targets[${index}]`;
    if (!isRecord(item)) return error(errors, path, "must be an object");
    point(item.center, `${path}.center`, errors);
    number(item, "radius", path, errors, 0);
    choice(item, "requires", path, COLORS, errors);
    if (typeof item.required !== "boolean") error(errors, `${path}.required`, "must be a boolean");
  });
}

export function validateTextArray(items: readonly unknown[], key: string, errors: IssueList): void {
  items.forEach((item, index) => {
    if (!isRecord(item)) return error(errors, `${key}[${index}]`, "must be an object");
    text(item, "text", `${key}[${index}]`, errors);
  });
}

export function validateTutorials(items: readonly unknown[], errors: IssueList): void {
  items.forEach((item, index) => {
    const path = `tutorials[${index}]`;
    if (!isRecord(item)) return error(errors, path, "must be an object");
    text(item, "id", path, errors);
    text(item, "text", path, errors);
    choice(item, "trigger", path, TRIGGERS, errors);
  });
}

export function validateSolution(items: readonly unknown[], componentIds: ReadonlySet<string>, errors: IssueList): void {
  items.forEach((item, index) => {
    const path = `solution[${index}]`;
    if (!isRecord(item)) return error(errors, path, "must be an object");
    const id = text(item, "componentId", path, errors);
    if (id !== null && !componentIds.has(id)) error(errors, `${path}.componentId`, `unknown component "${id}"`);
    if (item.angleDeg !== undefined) number(item, "angleDeg", path, errors);
    if (item.position === undefined && item.angleDeg === undefined) error(errors, path, "needs angleDeg or position");
    if (item.position !== undefined) point(item.position, `${path}.position`, errors);
  });
}
