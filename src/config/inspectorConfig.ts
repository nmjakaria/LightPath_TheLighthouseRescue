/*
 * Build-time tunables for the teaching overlay (PRD FR-041/FR-064). Every drawn size, label,
 * graph bound and default toggle lives here; colours come from the shared renderer palette.
 */
export const inspectorConfig = {
  defaults: {
    inspector: false,
    normalsOnly: false,
    glow: true,
    particles: true,
  },
  hit: {
    radius: 5,
    labelDx: 8,
    labelDy: -8,
  },
  normal: {
    length: 46,
    head: 7,
    faintAlpha: 0.45,
  },
  vector: {
    length: 54,
    head: 8,
    lineWidth: 2,
  },
  arc: {
    radius: 26,
    labelDistance: 34,
  },
  mirrorLine: {
    extend: 1.5,
    dash: [8, 6],
  },
  graph: {
    samples: 48,
    width: 168,
    height: 44,
    maxMs: 33.3,
    strokeWidth: 1.5,
  },
  text: {
    font: "12px 'JetBrains Mono', ui-monospace, monospace",
    x: 16,
    y: 20,
    lineHeight: 16,
    frameDecimals: 1,
  },
  decimals: 3,
} as const;
