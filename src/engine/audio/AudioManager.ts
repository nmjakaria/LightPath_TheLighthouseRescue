/*
 * Owns the Web Audio graph and enforces the PRD audio rules: no sound before the first gesture,
 * one cue per event with per-cue throttling, at most 8 concurrent voices, and instant mute through
 * the master gain. All sound is synthesized, so failures degrade to a fully playable silent game.
 */
import { audioConfig, type CueName } from "@/config/audioConfig";
import { DEFAULT_SETTINGS } from "@/config/settingsSchema";
import { noiseBuffer, noiseBurst, tone } from "./synth";

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  muted: boolean;
}

export type AudioContextFactory = () => AudioContext | null;

function browserContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const legacy = window as unknown as { webkitAudioContext?: typeof AudioContext };
  const Constructor = window.AudioContext ?? legacy.webkitAudioContext;
  if (!Constructor) return null;
  try {
    return new Constructor();
  } catch {
    return null;
  }
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private ambient: GainNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceLfo: OscillatorNode | null = null;
  private readonly expiries: number[] = [];
  private readonly lastPlayed = new Map<CueName, number>();
  private settings: AudioSettings;

  constructor(
    private readonly createContext: AudioContextFactory = browserContext,
    settings: AudioSettings = {
      masterVolume: DEFAULT_SETTINGS.masterVolume,
      sfxVolume: DEFAULT_SETTINGS.sfxVolume,
      ambientVolume: DEFAULT_SETTINGS.ambientVolume,
      muted: DEFAULT_SETTINGS.muted,
    },
  ) {
    this.settings = { ...settings };
  }

  get unlocked(): boolean {
    return this.ctx !== null;
  }

  get activeVoices(): number {
    if (!this.ctx) return 0;
    this.prune(this.ctx.currentTime);
    return this.expiries.length;
  }

  /** Must be called from a real user gesture; subsequent calls only resume a suspended context. */
  unlock(): void {
    if (this.ctx) {
      this.resume();
      return;
    }
    const ctx = this.createContext();
    if (!ctx) return;
    const master = ctx.createGain();
    const sfx = ctx.createGain();
    const ambient = ctx.createGain();
    master.connect(ctx.destination);
    sfx.connect(master);
    ambient.connect(master);
    this.ctx = ctx;
    this.master = master;
    this.sfx = sfx;
    this.ambient = ambient;
    this.applyGains();
    this.startAmbience();
    this.resume();
  }

  setSettings(next: AudioSettings): void {
    this.settings = { ...next };
    this.applyGains();
  }

  /** Returns false when audio is locked, muted, throttled or at the voice cap. */
  play(cue: CueName, angleStepDeg?: number): boolean {
    const ctx = this.ctx;
    if (!ctx || !this.sfx || this.settings.muted) return false;
    this.prune(ctx.currentTime);
    if (this.expiries.length >= audioConfig.maxVoices) return false;
    const last = this.lastPlayed.get(cue);
    if (last !== undefined && ctx.currentTime - last < audioConfig.cues[cue].minInterval) return false;

    const duration = this.schedule(cue, ctx, this.sfx, angleStepDeg);
    this.lastPlayed.set(cue, ctx.currentTime);
    this.expiries.push(ctx.currentTime + duration);
    return true;
  }

  dispose(): void {
    this.stopNode(this.ambienceSource);
    this.ambienceSource = null;
    this.stopNode(this.ambienceLfo);
    this.ambienceLfo = null;
    if (this.ctx) void this.ctx.close().catch(() => { /* context may already be closed */ });
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.ambient = null;
    this.expiries.length = 0;
    this.lastPlayed.clear();
  }

  private schedule(cue: CueName, ctx: AudioContext, sfx: GainNode, angleStepDeg?: number): number {
    const at = ctx.currentTime;
    const config = audioConfig.cues;
    switch (cue) {
      case "rotate": {
        const c = config.rotate;
        const step = angleStepDeg ?? c.defaultStepDeg;
        tone(ctx, sfx, { at, hz: c.baseHz + step * c.stepHz, duration: c.duration, level: c.level, type: c.type });
        return c.duration;
      }
      case "charge": {
        const c = config.charge;
        tone(ctx, sfx, { at, hz: c.baseHz, duration: c.duration, level: c.level, type: c.type });
        return c.duration;
      }
      case "activate":
        return this.notes(ctx, sfx, config.activate.notes, config.activate.noteDuration,
          config.activate.spacing, config.activate.level, config.activate.type);
      case "gate": {
        const c = config.gate;
        noiseBurst(ctx, sfx, { at, duration: c.duration, level: c.level, filterHz: c.filterHz, q: c.q });
        tone(ctx, sfx, { at, hz: c.thunkHz, duration: c.duration, level: c.level, type: "sine" });
        return c.duration;
      }
      case "uiClick": {
        const c = config.uiClick;
        tone(ctx, sfx, { at, hz: c.hz, duration: c.duration, level: c.level, type: c.type });
        return c.duration;
      }
      case "complete":
        return this.notes(ctx, sfx, config.complete.notes, config.complete.noteDuration,
          config.complete.spacing, config.complete.level, config.complete.type);
    }
  }

  private notes(
    ctx: AudioContext,
    sfx: GainNode,
    notes: readonly number[],
    noteDuration: number,
    spacing: number,
    level: number,
    type: OscillatorType,
  ): number {
    const at = ctx.currentTime;
    notes.forEach((hz, index) => {
      tone(ctx, sfx, { at: at + index * spacing, hz, duration: noteDuration, level, type });
    });
    return (notes.length - 1) * spacing + noteDuration;
  }

  private startAmbience(): void {
    if (!this.ctx || !this.ambient) return;
    const { bufferSec, filterHz, level, lfoHz, lfoDepth } = audioConfig.ambience;
    const ctx = this.ctx;
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, bufferSec);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterHz, ctx.currentTime);
    const swellGain = ctx.createGain();
    swellGain.gain.setValueAtTime(level, ctx.currentTime);
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(lfoHz, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(lfoDepth, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(swellGain.gain);
    source.connect(filter);
    filter.connect(swellGain);
    swellGain.connect(this.ambient);
    source.start();
    lfo.start();
    this.ambienceSource = source;
    this.ambienceLfo = lfo;
  }

  private applyGains(): void {
    if (!this.ctx || !this.master || !this.sfx || !this.ambient) return;
    const now = this.ctx.currentTime;
    for (const node of [this.master, this.sfx, this.ambient]) node.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.settings.muted ? 0 : this.settings.masterVolume, now);
    this.sfx.gain.setValueAtTime(this.settings.sfxVolume, now);
    this.ambient.gain.setValueAtTime(this.settings.ambientVolume, now);
  }

  private resume(): void {
    if (this.ctx?.state === "suspended") void this.ctx.resume().catch(() => { /* autoplay blocked */ });
  }

  private prune(now: number): void {
    for (let index = this.expiries.length - 1; index >= 0; index -= 1) {
      if (this.expiries[index] <= now) this.expiries.splice(index, 1);
    }
  }

  private stopNode(node: AudioScheduledSourceNode | null): void {
    if (!node) return;
    try {
      node.stop();
    } catch {
      /* already stopped */
    }
  }
}
