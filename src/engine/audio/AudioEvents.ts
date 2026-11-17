/*
 * Converts game-state transitions into one-shot cues (PRD FR-050): pitch-tagged rotation ticks,
 * charge hum, activation chime, gate mechanism and completion. Previous values live in reusable
 * arrays, so detection allocates nothing per frame; the manager handles throttling and voice caps.
 */
import type { CueName } from "@/config/audioConfig";
import type { GameState } from "@/engine/core/GameState";

export interface CueSink {
  play(cue: CueName, angleStepDeg?: number): boolean;
}

export class AudioEvents {
  private readonly angles: number[] = [];
  private readonly charging: boolean[] = [];
  private readonly active: boolean[] = [];
  private readonly gates: number[] = [];
  private completed = false;

  detect(state: GameState, sink: CueSink): void {
    this.detectRotation(state, sink);
    this.detectTargets(state, sink);
    this.detectGates(state, sink);
    if (state.status === "complete" && !this.completed) sink.play("complete");
    this.completed = state.status === "complete";
  }

  private detectRotation(state: GameState, sink: CueSink): void {
    let index = 0;
    let changed = false;
    for (const mirror of state.mirrors) changed = this.angleChanged(index++, mirror.angleDeg) || changed;
    for (const source of state.sources) changed = this.angleChanged(index++, source.headingDeg) || changed;
    if (changed) sink.play("rotate", state.level.rotationStepDeg ?? state.rotationStepDeg);
  }

  private angleChanged(index: number, angleDeg: number): boolean {
    if (this.angles.length <= index) {
      this.angles[index] = angleDeg;
      return false;
    }
    const changed = this.angles[index] !== angleDeg;
    this.angles[index] = angleDeg;
    return changed;
  }

  private detectTargets(state: GameState, sink: CueSink): void {
    for (let index = 0; index < state.targets.length; index += 1) {
      const target = state.targets[index];
      const charging = target.chargeSec > 0 && !target.active;
      if (charging && !this.charging[index]) sink.play("charge");
      this.charging[index] = charging;
      if (target.active && !this.active[index]) sink.play("activate");
      this.active[index] = target.active;
    }
  }

  private detectGates(state: GameState, sink: CueSink): void {
    for (let index = 0; index < state.gates.length; index += 1) {
      const fraction = state.gates[index].openFraction;
      if (fraction !== (this.gates[index] ?? 0)) sink.play("gate");
      this.gates[index] = fraction;
    }
  }

  reset(): void {
    this.angles.length = 0;
    this.charging.length = 0;
    this.active.length = 0;
    this.gates.length = 0;
    this.completed = false;
  }
}
