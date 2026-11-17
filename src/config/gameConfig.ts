/*
 * Build-time tunables for the whole game. Values that are also numeric/tolerance constants
 * are imported from lib/math/constants so there is only one literal definition in the repo.
 */
import {
  BOUNDARY,
  COMPLETION_HOLD_SEC,
  DT_CLAMP,
  EPS_PARALLEL,
  EPS_U,
  FINE_STEP,
  GATE_SLIDE_SEC,
  MAX_BOUNCES,
  MAX_SEGMENTS,
  MIN_INTENSITY,
  MIXED_THRESHOLD,
  MIRROR_LENGTH,
  MIRROR_REFLECTANCE,
  OFFSET,
  PRISM_TRANSMITTANCE,
  ROTATION_STEP,
  SWITCH_RADIUS,
  T_MIN,
  TARGET_ACTIVATION_SEC,
  TARGET_MIN_INTENSITY,
  TARGET_RADIUS,
  UNDO_LIMIT,
  WORLD,
} from "@/lib/math/constants";

export type QualityPreset = "low" | "medium" | "high";

export interface QualityPresetValues {
  particleCap: number;
  moteCap: number;
  glowPasses: number;
  waterLayers: number;
}

export interface GameConfig {
  world: { width: number; height: number };
  boundary: { x0: number; y0: number; x1: number; y1: number };
  tolerances: { epsParallel: number; epsU: number; tMin: number; offset: number };
  optics: {
    maxBounces: number;
    maxSegments: number;
    minIntensity: number;
    mirrorReflectance: number;
    prismTransmittance: number;
    prismSpreadDeg: number;
    mixedThreshold: number;
    repeatPositionGrid: number;
    repeatAngleGridDeg: number;
    lampHousingRadius: number;
    gateOpenFraction: number;
  };
  interaction: {
    rotationStepDeg: number;
    fineStepDeg: number;
    undoLimit: number;
    mirrorLength: number;
    targetRadius: number;
    switchRadius: number;
    lampHandleRadius: number;
    keyboardNudgeWU: number;
    fineNudgeWU: number;
  };
  targets: {
    activationSec: number;
    decayFactor: number;
    minIntensity: number;
    completionHoldSec: number;
  };
  scoring: {
    base: number;
    timePenaltyPerSec: number;
    movePenalty: number;
    hintPenalty: number;
    penaltyCap: number;
    minScore: number;
    stars: { three: number; two: number };
  };
  hints: {
    max: number;
    allSetText: string;
    pulseHz: number;
    outlineAlpha: number;
    ghostAlpha: number;
  };
  completion: {
    finaleSec: number;
    hintPromptSec: number;
  };
  quality: Record<QualityPreset, QualityPresetValues>;
  storage: { writeDebounceMs: number };
  render: {
    maxDpr: number;
    fpsSmoothing: number;
    backgroundStars: number;
    selectionRadius: number;
    beamPasses: readonly { width: number; alpha: number; core: boolean }[];
    lineWidth: {
      boundary: number;
      mirror: number;
      halo: number;
      target: number;
      obstacle: number;
      gate: number;
      prism: number;
      switch: number;
    };
    lampRadius: number;
    lampCoreRadius: number;
    labelFontSizePx: number;
    labelOffsetPx: number;
    targetCoreFraction: number;
    targetShapeFraction: number;
    targetShapeLineWidth: number;
    chargeArcOffsetPx: number;
    lockBadgeRadius: number;
    handleRadius: number;
    gateOpenAlpha: number;
    prismInteriorWidth: number;
    prismInteriorAlpha: number;
  };
  gateSlideSec: number;
  dtClamp: number;
}

export const gameConfig: GameConfig = {
  world: WORLD,
  boundary: BOUNDARY,
  tolerances: { epsParallel: EPS_PARALLEL, epsU: EPS_U, tMin: T_MIN, offset: OFFSET },
  optics: {
    maxBounces: MAX_BOUNCES,
    maxSegments: MAX_SEGMENTS,
    minIntensity: MIN_INTENSITY,
    mirrorReflectance: MIRROR_REFLECTANCE,
    prismTransmittance: PRISM_TRANSMITTANCE,
    prismSpreadDeg: 12,
    mixedThreshold: MIXED_THRESHOLD,
    repeatPositionGrid: 0.5,
    repeatAngleGridDeg: 0.5,
    lampHousingRadius: 16,
    gateOpenFraction: 0.5,
  },
  interaction: {
    rotationStepDeg: ROTATION_STEP,
    fineStepDeg: FINE_STEP,
    undoLimit: UNDO_LIMIT,
    mirrorLength: MIRROR_LENGTH,
    targetRadius: TARGET_RADIUS,
    switchRadius: SWITCH_RADIUS,
    lampHandleRadius: 22,
    keyboardNudgeWU: 20,
    fineNudgeWU: 5,
  },
  targets: {
    activationSec: TARGET_ACTIVATION_SEC,
    decayFactor: 1.5,
    minIntensity: TARGET_MIN_INTENSITY,
    completionHoldSec: COMPLETION_HOLD_SEC,
  },
  scoring: {
    base: 1000,
    timePenaltyPerSec: 2,
    movePenalty: 15,
    hintPenalty: 100,
    penaltyCap: 300,
    minScore: 100,
    stars: { three: 800, two: 500 },
  },
  hints: {
    max: 3,
    allSetText: "Everything matches the reference solution — follow the beam.",
    pulseHz: 1.2,
    outlineAlpha: 0.85,
    ghostAlpha: 0.35,
  },
  completion: {
    finaleSec: 2,
    hintPromptSec: 60,
  },
  quality: {
    low: { particleCap: 80, moteCap: 15, glowPasses: 1, waterLayers: 2 },
    medium: { particleCap: 200, moteCap: 40, glowPasses: 2, waterLayers: 3 },
    high: { particleCap: 400, moteCap: 80, glowPasses: 3, waterLayers: 4 },
  },
  storage: { writeDebounceMs: 150 },
  render: {
    maxDpr: 2,
    fpsSmoothing: 0.1,
    backgroundStars: 48,
    selectionRadius: 18,
    beamPasses: [
      { width: 10, alpha: 0.18, core: false },
      { width: 4, alpha: 0.55, core: false },
      { width: 1.5, alpha: 1, core: true },
    ],
    lineWidth: {
      boundary: 2,
      mirror: 5,
      halo: 8,
      target: 3,
      obstacle: 2,
      gate: 5,
      prism: 2,
      switch: 3,
    },
    lampRadius: 16,
    lampCoreRadius: 6,
    labelFontSizePx: 12,
    labelOffsetPx: 8,
    targetCoreFraction: 1 / 3,
    targetShapeFraction: 0.5,
    targetShapeLineWidth: 2,
    chargeArcOffsetPx: 6,
    lockBadgeRadius: 5,
    handleRadius: 5,
    gateOpenAlpha: 0.15,
    prismInteriorWidth: 2,
    prismInteriorAlpha: 0.35,
  },
  gateSlideSec: GATE_SLIDE_SEC,
  dtClamp: DT_CLAMP,
};

export const STORAGE_KEYS = {
  settings: "lightpath.v1.settings",
  progress: "lightpath.v1.progress",
} as const;

export const SCHEMA_VERSIONS = { settings: 1, progress: 1 } as const;
