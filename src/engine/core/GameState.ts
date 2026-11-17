/*
 * Mutable engine state kept outside React. Interaction is delegated to GameInteraction; this class
 * owns level systems, the dirty-flag solve, gate animation, target charge and completion. React
 * receives only a low-rate HUD snapshot (PRD §12.8, FR-022–037).
 */
import { gameConfig } from "@/config/gameConfig";
import { createCompletion, requiredTargetsActive, type CompletionSummary } from "@/game/completion";
import { approachOpenFraction, gateBlocks } from "@/game/gates";
import { initialGeometry } from "@/game/geometry";
import { getHint, hintGeometryFrom, type HintDisplay } from "@/game/hints";
import { buildOpticsScene } from "@/game/opticsScene";
import { eventActivatesSwitch, eventChargesTarget, nextCharge } from "@/game/targets";
import { solveOptics } from "@/engine/optics/tracer";
import { GameInteraction } from "./GameInteraction";
import { buildHudSnapshot, isPlayCommand, type HudSnapshot } from "./hud";
import type { InputCommand, InteractionFeedback } from "@/types/input";
import type {
  GateRuntime,
  LevelConfig,
  LevelMirrorConfig,
  MovableObstacleRuntime,
  SourceRuntime,
  SwitchRuntime,
  TargetRuntime,
} from "@/types/level";
import type { OpticsResult } from "@/types/optics";
import type { Vec2 } from "@/types/vec2";

export type { HudSnapshot };
function emptyResult(): OpticsResult {
  return {
    segments: [],
    events: [],
    stats: { segmentCount: 0, maxBounce: 0, terminated: {}, solveMs: 0 },
  };
}

export class GameState {
  readonly sources: SourceRuntime[];
  readonly mirrors: LevelMirrorConfig[];
  readonly movableObstacles: MovableObstacleRuntime[];
  readonly switches: SwitchRuntime[];
  readonly gates: GateRuntime[];
  readonly targets: TargetRuntime[];
  readonly interaction: GameInteraction;
  elapsedSec = 0;
  status: "playing" | "complete" = "playing";
  dirty = true;
  solveCount = 0;
  result: OpticsResult = emptyResult();
  rotationStepDeg: number;
  paused = false;
  started = false;
  reducedMotion = false;
  hintsUsed = 0;
  hint: HintDisplay | null = null;
  completion: CompletionSummary | null = null;
  celebrationSec = 0;

  private holdSec = 0;
  private lastProgressMoves = 0;
  private lastProgressLit = 0;
  private lastProgressAtSec = 0;

  constructor(
    readonly level: LevelConfig,
    rotationStepDeg: number = gameConfig.interaction.rotationStepDeg,
  ) {
    this.rotationStepDeg = rotationStepDeg;
    this.sources = level.sources.map((source) => ({ ...source, color: { ...source.color } }));
    this.mirrors = level.mirrors.map((mirror) => ({ ...mirror }));
    this.movableObstacles = level.movableObstacles.map((obstacle) => ({
      ...obstacle,
      start: { ...obstacle.start },
      localVertices: obstacle.localVertices.map((vertex) => ({ ...vertex })),
      position: { ...obstacle.start },
    }));
    this.switches = level.switches.map((input) => ({ ...input, active: false }));
    this.gates = level.gates.map((gate) => ({ ...gate, openFraction: 0 }));
    this.targets = level.targets.map((target) => ({ ...target, chargeSec: 0, active: false }));
    this.interaction = new GameInteraction({
      components: { mirrors: this.mirrors, sources: this.sources, movableObstacles: this.movableObstacles },
      stepDeg: () => this.level.rotationStepDeg ?? this.rotationStepDeg,
      onGeometryChange: () => { this.dirty = true; },
    });
  }

  get selectedId(): string | null { return this.interaction.selectedId; }
  get hoveredId(): string | null { return this.interaction.hoveredId; }
  get moves(): number { return this.interaction.moves; }
  get feedback(): InteractionFeedback | null { return this.interaction.feedback; }
  get dragId(): string | null { return this.interaction.dragId; }
  get obstacleDragId(): string | null { return this.interaction.obstacleDragId; }
  get hintsRemaining(): number { return Math.max(0, gameConfig.hints.max - this.hintsUsed); }
  get celebrationReady(): boolean { return this.celebrationSec >= (this.level.celebrationSec ?? 0); }
  kindOf(id: string | null): "mirror" | "source" | "obstacle" | null { return this.interaction.kindOf(id); }
  componentCenter(id: string | null): Vec2 | null { return this.interaction.componentCenter(id); }

  snapshot(): HudSnapshot {
    return buildHudSnapshot({
      level: this.level,
      moves: this.moves,
      elapsedSec: this.elapsedSec,
      selectedId: this.selectedId,
      hoveredId: this.hoveredId,
      status: this.status,
      paused: this.paused,
      started: this.started,
      targets: this.targets,
      switches: this.switches,
      gates: this.gates,
      canUndo: this.interaction.canUndo,
      feedback: this.feedback,
      hintsUsed: this.hintsUsed,
      hintsRemaining: this.hintsRemaining,
      hint: this.hint,
      completion: this.completion,
      celebrationReady: this.celebrationReady,
      progressAtSec: this.lastProgressAtSec,
      progressLit: this.lastProgressLit,
      prismHit: this.result.events.some((event) => event.type === "prism"),
    });
  }

  /** Completion freezes play input but still allows hover feedback. */
  apply(command: InputCommand): void {
    if (command.type === "hover") {
      this.interaction.apply(command);
      return;
    }
    if (command.type === "pause") {
      this.paused = command.paused;
      return;
    }
    if (command.type === "pauseToggle") {
      this.paused = !this.paused;
      return;
    }
    if (this.paused || this.status === "complete") return;
    if (command.type === "reset") return this.reset();
    if (command.type === "hint") return this.useHint();
    if (isPlayCommand(command)) this.started = true;
    this.interaction.apply(command);
  }

  private useHint(): void {
    if (this.hintsRemaining === 0) return;
    this.started = true;
    this.hintsUsed += 1;
    this.hint = getHint(
      this.level,
      hintGeometryFrom(this.mirrors, this.sources, this.movableObstacles),
      this.hintsUsed as 1 | 2 | 3,
    );
  }

  /** Solves only when geometry changed, then advances switches, gates and target charge. */
  tick(dt: number): void {
    if (this.paused || !Number.isFinite(dt) || dt < 0) return;
    if (this.status === "complete") {
      const target = this.level.celebrationSec ?? 0;
      this.celebrationSec = Math.min(target, this.celebrationSec + dt);
      return;
    }
    if (this.started) this.elapsedSec += dt;
    if (this.dirty) {
      this.result = solveOptics(buildOpticsScene({
        level: this.level,
        sources: this.sources,
        mirrors: this.mirrors,
        movableObstacles: this.movableObstacles,
        switches: this.switches,
        gates: this.gates,
        targets: this.targets,
      }));
      this.solveCount += 1;
      this.dirty = false;
    }
    this.updateSwitchesAndGates(dt);
    this.updateTargets(dt);
    this.trackProgress();
  }

  private trackProgress(): void {
    const lit = this.targets.filter((target) => target.active).length;
    if (this.moves !== this.lastProgressMoves || lit > this.lastProgressLit) {
      this.lastProgressMoves = this.moves;
      this.lastProgressLit = lit;
      this.lastProgressAtSec = this.elapsedSec;
    }
  }

  private finalizeCompletion(): void {
    this.status = "complete";
    this.completion = createCompletion(this.level, {
      parTimeSec: this.level.par.timeSec,
      parMoves: this.level.par.moves,
      timeSec: this.elapsedSec,
      moves: this.moves,
      hintsUsed: this.hintsUsed,
    });
  }

  private reset(): void {
    this.interaction.reset(initialGeometry(this.level));
    this.elapsedSec = 0;
    this.holdSec = 0;
    this.celebrationSec = 0;
    this.completion = null;
    this.status = "playing";
    this.started = false;
    this.lastProgressMoves = 0;
    this.lastProgressLit = 0;
    this.lastProgressAtSec = 0;
    this.result = emptyResult();
    for (const input of this.switches) input.active = false;
    for (const gate of this.gates) gate.openFraction = 0;
    for (const target of this.targets) {
      target.chargeSec = 0;
      target.active = false;
    }
  }

  private updateSwitchesAndGates(dt: number): void {
    for (const input of this.switches) {
      input.active = this.result.events.some((event) => eventActivatesSwitch(event, input));
    }
    for (const gate of this.gates) {
      const linked = this.switches.find((input) => input.gateId === gate.id);
      const wasBlocking = gateBlocks(gate.openFraction);
      gate.openFraction = approachOpenFraction(gate.openFraction, linked?.active ? 1 : 0, dt);
      if (wasBlocking !== gateBlocks(gate.openFraction)) this.dirty = true;
    }
  }

  private updateTargets(dt: number): void {
    for (const target of this.targets) {
      const hit = this.result.events.find((event) => event.objectId === target.id);
      const lit = hit !== undefined && eventChargesTarget(hit, target);
      target.chargeSec = nextCharge(target.chargeSec, dt, lit);
      target.active = target.chargeSec >= gameConfig.targets.activationSec;
    }
    if (requiredTargetsActive(this.targets)) {
      this.holdSec += dt;
      if (this.holdSec >= gameConfig.targets.completionHoldSec) this.finalizeCompletion();
    } else {
      this.holdSec = 0;
    }
  }
}
