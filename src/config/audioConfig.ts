/*
 * Build-time tunables for the synthesized Web Audio cues (PRD FR-050/051). Volumes come from the
 * settings schema; this file owns every frequency, duration, level, throttle and voice cap so the
 * engine contains no magic audio numbers and no audio assets are needed.
 */
export const audioConfig = {
  maxVoices: 8,
  envelope: { attack: 0.008, floor: 0.0001, releaseTail: 0.02 },
  ambience: {
    bufferSec: 2,
    filterHz: 380,
    level: 0.14,
    lfoHz: 0.08,
    lfoDepth: 0.05,
  },
  cues: {
    rotate: {
      duration: 0.09, level: 0.22, type: "triangle" as const,
      baseHz: 380, stepHz: 14, defaultStepDeg: 15, minInterval: 0.04,
    },
    charge: {
      duration: 0.35, level: 0.12, type: "sine" as const,
      baseHz: 165, minInterval: 0.2,
    },
    activate: {
      noteDuration: 0.13, spacing: 0.075, level: 0.26, type: "sine" as const,
      notes: [659, 880, 1319], minInterval: 0.1,
    },
    gate: {
      duration: 0.28, level: 0.2, filterHz: 720, q: 0.9,
      thunkHz: 110, minInterval: 0.12,
    },
    uiClick: {
      duration: 0.045, level: 0.11, type: "square" as const,
      hz: 920, minInterval: 0.03,
    },
    complete: {
      noteDuration: 0.18, spacing: 0.12, level: 0.28, type: "triangle" as const,
      notes: [523, 659, 784, 1047], minInterval: 0.5,
    },
  },
} as const;

export type CueName = keyof typeof audioConfig.cues;
