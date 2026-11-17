/* AudioEvents tests verify that cues fire on state transitions only, using a lightweight fake
 * GameState rather than replaying a solved level. */
import { describe, expect, it } from "vitest";
import type { CueName } from "@/config/audioConfig";
import { AudioEvents, type CueSink } from "@/engine/audio/AudioEvents";
import type { GameState } from "@/engine/core/GameState";

class RecordingSink implements CueSink {
  readonly played: { cue: CueName; step?: number }[] = [];

  play(cue: CueName, angleStepDeg?: number): boolean {
    this.played.push({ cue, step: angleStepDeg });
    return true;
  }
}

function fakeState(overrides: Partial<{
  mirrors: { angleDeg: number }[];
  sources: { headingDeg: number }[];
  targets: { chargeSec: number; active: boolean }[];
  gates: { openFraction: number }[];
  status: "playing" | "complete";
  rotationStepDeg: number;
  level: { rotationStepDeg?: number };
}> = {}): GameState {
  const state = {
    mirrors: overrides.mirrors ?? [{ angleDeg: 30 }],
    sources: overrides.sources ?? [],
    targets: overrides.targets ?? [],
    gates: overrides.gates ?? [],
    status: overrides.status ?? "playing",
    rotationStepDeg: overrides.rotationStepDeg ?? 15,
    level: overrides.level ?? {},
  };
  return state as unknown as GameState;
}

describe("AudioEvents", () => {
  it("does not cue the initial state", () => {
    const events = new AudioEvents();
    const sink = new RecordingSink();
    events.detect(fakeState({ targets: [{ chargeSec: 0, active: false }] }), sink);
    expect(sink.played).toEqual([]);
  });

  it("emits a rotation tick with the configured step when a heading changes", () => {
    const events = new AudioEvents();
    const sink = new RecordingSink();
    events.detect(fakeState(), sink);
    events.detect(fakeState({ mirrors: [{ angleDeg: 45 }], level: { rotationStepDeg: 5 } }), sink);
    expect(sink.played).toEqual([{ cue: "rotate", step: 5 }]);
  });

  it("cues charge once, activation once, then stays quiet while the target remains lit", () => {
    const events = new AudioEvents();
    const sink = new RecordingSink();
    events.detect(fakeState({ targets: [{ chargeSec: 0, active: false }] }), sink);
    events.detect(fakeState({ targets: [{ chargeSec: 0.2, active: false }] }), sink);
    events.detect(fakeState({ targets: [{ chargeSec: 0.2, active: false }] }), sink);
    events.detect(fakeState({ targets: [{ chargeSec: 0.35, active: true }] }), sink);
    events.detect(fakeState({ targets: [{ chargeSec: 0.35, active: true }] }), sink);
    expect(sink.played.map((entry) => entry.cue)).toEqual(["charge", "activate"]);
  });

  it("cues the gate mechanism only when the open fraction changes", () => {
    const events = new AudioEvents();
    const sink = new RecordingSink();
    events.detect(fakeState({ gates: [{ openFraction: 0 }] }), sink);
    events.detect(fakeState({ gates: [{ openFraction: 0.5 }] }), sink);
    events.detect(fakeState({ gates: [{ openFraction: 0.5 }] }), sink);
    expect(sink.played.map((entry) => entry.cue)).toEqual(["gate"]);
  });

  it("plays the completion jingle once and can be reset for a new level", () => {
    const events = new AudioEvents();
    const sink = new RecordingSink();
    events.detect(fakeState({ status: "complete" }), sink);
    events.detect(fakeState({ status: "complete" }), sink);
    expect(sink.played).toEqual([{ cue: "complete" }]);

    events.reset();
    events.detect(fakeState({ status: "complete" }), sink);
    expect(sink.played).toEqual([{ cue: "complete" }, { cue: "complete" }]);
  });

  it("detects rotatable source headings too", () => {
    const events = new AudioEvents();
    const sink = new RecordingSink();
    events.detect(fakeState({ sources: [{ headingDeg: 90 }] }), sink);
    events.detect(fakeState({ sources: [{ headingDeg: 105 }] }), sink);
    expect(sink.played.map((entry) => entry.cue)).toEqual(["rotate"]);
  });
});
