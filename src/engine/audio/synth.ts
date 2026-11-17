/*
 * Small Web Audio building blocks: a pitched oscillator with an attack/decay envelope and a
 * filtered noise burst. Every node is connected once and stopped at a scheduled time, so the
 * browser can reclaim voices without the game owning timers. No samples or audio files are used.
 */
import { audioConfig } from "@/config/audioConfig";

export interface ToneOptions {
  at: number;
  hz: number;
  duration: number;
  level: number;
  type: OscillatorType;
}

export function tone(ctx: AudioContext, destination: AudioNode, options: ToneOptions): void {
  const { attack, floor, releaseTail } = audioConfig.envelope;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.hz, options.at);
  gain.gain.setValueAtTime(0, options.at);
  gain.gain.linearRampToValueAtTime(Math.max(floor, options.level), options.at + attack);
  gain.gain.exponentialRampToValueAtTime(floor, options.at + options.duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(options.at);
  oscillator.stop(options.at + options.duration + releaseTail);
}

export interface NoiseOptions {
  at: number;
  duration: number;
  level: number;
  filterHz: number;
  q?: number;
}

export function noiseBurst(ctx: AudioContext, destination: AudioNode, options: NoiseOptions): void {
  const { attack, floor, releaseTail } = audioConfig.envelope;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, options.duration);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(options.filterHz, options.at);
  filter.Q.setValueAtTime(options.q ?? audioConfig.cues.gate.q, options.at);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, options.at);
  gain.gain.linearRampToValueAtTime(Math.max(floor, options.level), options.at + attack);
  gain.gain.exponentialRampToValueAtTime(floor, options.at + options.duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(options.at);
  source.stop(options.at + options.duration + releaseTail);
}

/** White noise generated once per requested length; reused as the looping ocean ambience buffer. */
export function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }
  return buffer;
}
