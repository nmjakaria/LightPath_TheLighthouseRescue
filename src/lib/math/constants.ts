/*
 * Numeric constants from PRD §20.3 / AGENTS §3.4 live here so the solver, renderer and tests
 * share one definition of every tolerance, cap and world size. Angle data is stored in degrees;
 * the conversion factors at the bottom are the only place that convention is encoded.
 */

export const EPS_PARALLEL = 1e-9;
export const EPS_U = 1e-6;
export const T_MIN = 1e-3;
export const OFFSET = 0.01;
export const ANGLE_EPS = 1e-6;

export const MAX_BOUNCES = 24;
export const MAX_SEGMENTS = 160;
export const MIN_INTENSITY = 0.05;
export const MIRROR_REFLECTANCE = 0.95;
export const MIRROR_LENGTH = 96;
export const PRISM_TRANSMITTANCE = 0.9;
export const TARGET_RADIUS = 28;
export const SWITCH_RADIUS = 24;
export const MIXED_THRESHOLD = 0.2;
export const TARGET_ACTIVATION_SEC = 0.35;
export const TARGET_MIN_INTENSITY = 0.3;
export const COMPLETION_HOLD_SEC = 0.6;
export const GATE_SLIDE_SEC = 0.5;
export const ROTATION_STEP = 15;
export const FINE_STEP = 5;
export const UNDO_LIMIT = 50;
export const DT_CLAMP = 0.05;

export const WORLD = { width: 1280, height: 720 } as const;
export const BOUNDARY = { x0: 40, y0: 40, x1: 1240, y1: 680 } as const;

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
export const FULL_TURN_DEG = 360;
export const MIRROR_PERIOD_DEG = 180;
