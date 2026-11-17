/*
 * Pure, time-based animation functions for PRD §12.5. Every value is derived from accumulated
 * seconds (GameLoop.stats.elapsedSec), never a frame counter, so a 30 FPS and a 144 FPS machine see
 * the same phase at the same game time. Reduced motion freezes the sweep and dampens amplitude.
 */
import { visualConfig } from "@/config/visualConfig";
import { clamp01, lerp } from "@/lib/math/easing";

const { animation } = visualConfig;

export function starPhase(index: number): number {
  return (index * 2.399963) % (Math.PI * 2);
}

export function starAlpha(index: number, timeSec: number, reducedMotion = false): number {
  const phase = starPhase(index);
  const swing = reducedMotion ? animation.stars.alphaSwing * 0.25 : animation.stars.alphaSwing;
  return animation.stars.alphaBase + swing * Math.sin(animation.stars.omega * timeSec + phase);
}

export function waterY(
  layer: number,
  x: number,
  timeSec: number,
  layerCount: number,
  reducedMotion = false,
): number {
  const { water } = animation;
  const factor = layerCount <= 1 ? 0.5 : clamp01(layer / (layerCount - 1));
  const amplitude = lerp(water.amplitudeMin, water.amplitudeMax, factor) * (reducedMotion ? 0.4 : 1);
  const omega = lerp(water.omegaMin, water.omegaMax, factor);
  const phase = x * (1 + layer * water.parallax) / water.wavelength * Math.PI * 2 + layer * 0.8;
  return water.baseY - layer * water.spacing + amplitude * Math.sin(phase + omega * timeSec);
}

export function sweepAngleDeg(timeSec: number, reducedMotion = false): number {
  return reducedMotion
    ? animation.sweep.startDeg
    : animation.sweep.startDeg + animation.sweep.degreesPerSec * timeSec;
}

export function beamDashOffset(timeSec: number): number {
  return -animation.beamDashSpeed * timeSec;
}

export function beamPulse(timeSec: number, reducedMotion = false): number {
  if (reducedMotion) return 1;
  return 1 + animation.beamPulse * Math.sin(timeSec * Math.PI * 2);
}

export function glowScale(timeSec: number, reducedMotion = false): number {
  if (reducedMotion) return 1;
  return 1 + animation.glow.scale * Math.sin(timeSec * Math.PI * 2 * animation.glow.hz);
}

export function mistOffset(timeSec: number, layer: number, reducedMotion = false): number {
  const speed = reducedMotion ? animation.mist.speed * 0.3 : animation.mist.speed;
  return speed * timeSec * (layer + 1);
}
