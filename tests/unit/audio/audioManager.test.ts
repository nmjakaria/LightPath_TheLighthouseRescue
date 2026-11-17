/* AudioManager tests use the fake graph to prove autoplay gating, gain/mute wiring, throttling,
 * the 8-voice cap, angle-dependent pitch and lifecycle cleanup without a browser. */
import { beforeEach, describe, expect, it } from "vitest";
import { audioConfig } from "@/config/audioConfig";
import { AudioManager, type AudioSettings } from "@/engine/audio/AudioManager";
import { FakeAudioContext, fakeContextFactory } from "./fakeAudio";

const SETTINGS: AudioSettings = {
  masterVolume: 0.5,
  sfxVolume: 0.7,
  ambientVolume: 0.4,
  muted: false,
};

describe("AudioManager", () => {
  let context: FakeAudioContext;
  let manager: AudioManager;

  beforeEach(() => {
    context = new FakeAudioContext();
    manager = new AudioManager(fakeContextFactory(context), SETTINGS);
  });

  it("is silent until a user gesture unlocks the context (FR-051)", () => {
    expect(manager.unlocked).toBe(false);
    expect(manager.play("uiClick")).toBe(false);
    expect(context.oscillators).toHaveLength(0);

    manager.unlock();

    expect(manager.unlocked).toBe(true);
    expect(context.resumeCalls).toBe(1);
    expect(context.state).toBe("running");
    expect(manager.play("uiClick")).toBe(true);
  });

  it("routes master, SFX and ambient gains and applies mute instantly (FR-051)", () => {
    manager.unlock();
    const [master, sfx, ambient] = context.gains;
    expect(master.gain.value).toBeCloseTo(0.5);
    expect(sfx.gain.value).toBeCloseTo(0.7);
    expect(ambient.gain.value).toBeCloseTo(0.4);

    manager.setSettings({ ...SETTINGS, masterVolume: 0.9, muted: true });
    expect(master.gain.value).toBe(0);
    expect(manager.play("uiClick")).toBe(false);
    const count = context.oscillators.length;

    manager.setSettings({ ...SETTINGS, masterVolume: 0.9, muted: false });
    expect(master.gain.value).toBeCloseTo(0.9);
    manager.play("uiClick");
    expect(context.oscillators.length).toBe(count + 1);
  });

  it("starts a looping low-pass ocean bed with an LFO (FR-050)", () => {
    manager.unlock();
    const source = context.sources[0];
    const filter = context.filters.find((node) => node.frequency.value === audioConfig.ambience.filterHz);
    expect(source.loop).toBe(true);
    expect(source.started).toHaveLength(1);
    expect(filter).toBeDefined();
    expect(context.oscillators.some((node) => node.frequency.value === audioConfig.ambience.lfoHz)).toBe(true);
  });

  it("pitches the rotate tick by the angle step (FR-050)", () => {
    manager.unlock();
    manager.play("rotate", 5);
    context.currentTime += 1;
    manager.play("rotate", 15);
    const [fine, coarse] = context.oscillators.slice(-2); // index 0 is the ambience LFO
    expect(fine.frequency.value).toBe(audioConfig.cues.rotate.baseHz + 5 * audioConfig.cues.rotate.stepHz);
    expect(coarse.frequency.value).toBe(audioConfig.cues.rotate.baseHz + 15 * audioConfig.cues.rotate.stepHz);
    expect(coarse.frequency.value).toBeGreaterThan(fine.frequency.value);
  });

  it("schedules jingles and the gate thunk with noise (FR-050)", () => {
    manager.unlock();
    const baseline = context.oscillators.length; // the ambience LFO
    manager.play("activate");
    manager.play("complete");
    manager.play("gate");
    expect(context.oscillators).toHaveLength(baseline + audioConfig.cues.activate.notes.length
      + audioConfig.cues.complete.notes.length + 1);
    expect(context.sources.length).toBe(2); // ambience + gate noise
    expect(context.filters.some((node) => node.type === "bandpass")).toBe(true);
  });

  it("throttles repeated cues (FR-050)", () => {
    manager.unlock();
    for (let index = 0; index < 20; index += 1) manager.play("uiClick");
    expect(manager.activeVoices).toBe(1);
    context.currentTime += audioConfig.cues.uiClick.minInterval;
    expect(manager.play("uiClick")).toBe(true);
  });

  it("never exceeds 8 voices (FR-050)", () => {
    manager.unlock();
    for (const cue of ["complete", "activate", "gate", "charge", "rotate", "uiClick"] as const) {
      expect(manager.play(cue, 5)).toBe(true);
    }
    expect(manager.activeVoices).toBe(6);

    // The short cues are still inside their envelopes at t=0.04 and their throttles have passed.
    context.currentTime = 0.04;
    expect(manager.play("rotate", 5)).toBe(true);
    expect(manager.play("uiClick")).toBe(true);
    expect(manager.play("rotate", 5)).toBe(false);
    expect(manager.activeVoices).toBe(audioConfig.maxVoices);

    context.currentTime += 1;
    expect(manager.play("rotate", 5)).toBe(true);
  });

  it("frees voices as scheduled sounds expire", () => {
    manager.unlock();
    manager.play("uiClick");
    expect(manager.activeVoices).toBe(1);
    context.currentTime += audioConfig.cues.uiClick.duration + 1;
    expect(manager.activeVoices).toBe(0);
    expect(manager.play("uiClick")).toBe(true);
  });

  it("closes the context and stops ambience on dispose", () => {
    manager.unlock();
    manager.play("uiClick");
    manager.dispose();
    expect(context.closeCalls).toBe(1);
    expect(context.sources[0].stopped).toHaveLength(1);
    expect(context.oscillators[0].stopped).toHaveLength(1);
    expect(manager.unlocked).toBe(false);
    expect(manager.activeVoices).toBe(0);
    expect(manager.play("uiClick")).toBe(false);
  });

  it("stays silent when the browser has no Web Audio support", () => {
    const unavailable = new AudioManager(() => null, SETTINGS);
    unavailable.unlock();
    expect(unavailable.unlocked).toBe(false);
    expect(unavailable.play("uiClick")).toBe(false);
    expect(() => unavailable.dispose()).not.toThrow();
  });
});
