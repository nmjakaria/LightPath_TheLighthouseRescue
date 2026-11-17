/*
 * Data validation for PRD FR-012 / TC-E08. Static levels are typed, but this runs on unknown input
 * so a malformed level produces a readable error screen instead of a crash. Errors block loading;
 * spacing overlaps are warnings because reference coordinates may still be playtested (PRD A-10).
 */
import {
  array,
  checkIds,
  choice,
  DIFFICULTIES,
  error,
  isRecord,
  number,
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
} from "./levelValidatorFields";
import { spreadComponents, warnSpacing } from "./levelValidatorSpacing";
import type { IssueList, ValidationResult } from "./validationTypes";

export type { ValidationIssue, ValidationResult } from "./validationTypes";

const COMPONENT_KEYS = [
  "sources", "mirrors", "prisms", "obstacles", "movableObstacles", "switches", "gates", "targets",
] as const;

interface ValidationFields {
  sources: unknown[];
  mirrors: unknown[];
  prisms: unknown[];
  obstacles: unknown[];
  movableObstacles: unknown[];
  switches: unknown[];
  gates: unknown[];
  targets: unknown[];
  tutorials: unknown[];
  hints: unknown[];
  solution: unknown[];
}

/** Returns every blocking error plus non-blocking spacing warnings. */
export function validateLevel(raw: unknown): ValidationResult {
  const errors: IssueList = [];
  const warnings: IssueList = [];
  if (!isRecord(raw)) {
    return { valid: false, errors: [{ path: "level", message: "must be an object" }], warnings };
  }

  validateHeader(raw, errors);
  const fields = collectFields(raw, errors);
  const componentIds = new Set<string>();
  for (const key of COMPONENT_KEYS) checkIds(fields[key], key, errors, componentIds);

  validateSources(fields.sources, errors);
  validateMirrors(fields.mirrors, errors);
  validatePrisms(fields.prisms, errors);
  validateObstacles(fields.obstacles, errors);
  validateMovable(fields.movableObstacles, errors);
  validateSwitches(fields.switches, errors);
  validateGates(fields.gates, errors);
  validateTargets(fields.targets, errors);
  validateTutorials(fields.tutorials, errors);
  validateTextArray(fields.hints, "hints", errors);
  validateSolution(fields.solution, componentIds, errors);
  validateLinks(fields, errors);

  warnSpacing(spreadComponents(raw, Array.from(componentIds)), warnings);
  return { valid: errors.length === 0, errors, warnings };
}

function validateHeader(raw: Record<string, unknown>, errors: IssueList): void {
  text(raw, "id", "level", errors);
  text(raw, "name", "level", errors);
  text(raw, "story", "level", errors);
  const index = number(raw, "index", "level", errors, 1);
  if (index !== null && !Number.isInteger(index)) error(errors, "level.index", "must be an integer");
  choice(raw, "difficulty", "level", DIFFICULTIES, errors);

  if (!isRecord(raw.par)) {
    error(errors, "par", "must be an object");
  } else {
    number(raw.par, "timeSec", "par", errors, 0);
    number(raw.par, "moves", "par", errors, 0);
  }
  if (raw.rotationStepDeg !== undefined) number(raw, "rotationStepDeg", "level", errors, 0);
  if (raw.celebrationSec !== undefined) number(raw, "celebrationSec", "level", errors, 0);
}

function collectFields(raw: Record<string, unknown>, errors: IssueList): ValidationFields {
  return {
    sources: array(raw, "sources", errors),
    mirrors: array(raw, "mirrors", errors),
    prisms: array(raw, "prisms", errors),
    obstacles: array(raw, "obstacles", errors),
    movableObstacles: array(raw, "movableObstacles", errors),
    switches: array(raw, "switches", errors),
    gates: array(raw, "gates", errors),
    targets: array(raw, "targets", errors),
    tutorials: array(raw, "tutorials", errors),
    hints: array(raw, "hints", errors),
    solution: array(raw, "solution", errors),
  };
}

function validateLinks(
  fields: { gates: unknown[]; switches: unknown[]; targets: unknown[] },
  errors: IssueList,
): void {
  const gateIds = new Set(fields.gates.filter(isRecord).map((gate) => gate.id));
  fields.switches.forEach((item, index) => {
    if (isRecord(item) && typeof item.gateId === "string" && !gateIds.has(item.gateId)) {
      error(errors, `switches[${index}].gateId`, `unknown gate "${item.gateId}"`);
    }
  });
  if (!fields.targets.some((item) => isRecord(item) && item.required === true)) {
    error(errors, "targets", "at least one target must be required");
  }
}
