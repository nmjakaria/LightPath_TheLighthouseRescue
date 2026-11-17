/*
 * Mutable engine state kept outside React. Interaction is delegated to GameInteraction; this class
 * owns level systems, the dirty-flag solve, gate animation, target charge and completion. React
 * receives only a low-rate HUD snapshot (PRD §12.8, FR-022–037).
 */
import { gameConfig } from "@/config/gameConfig";
import { approachOpenFraction, gateBlocks } from "@/game/gates";
import { initialGeometry } from "@/game/geometry";
import { worldVertices } from "@/game/movableObstacles";
import { eventActivatesSwitch, eventChargesTarget, nextCharge } from "@/game/targets";
import { solveOptics } from "@/engine/optics/tracer";
import { GameInteraction } from "./GameInteraction";
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
import type { OpticsResult, OpticsScene } from "@/types/optics";
import type { Vec2 } from "@/types/vec2";

export interface HudSnapshot {
  levelId: string;
  moves: number;
  timeSec: number;
  selectedId: string | null;
  hoveredId: string | null;
  status: "playing" | "complete";
  litTargets: number;
  requiredTargets: number;
  litSwitches: number;
  openGates: number;
  feedback: InteractionFeedback | null;
  canUndo: boolean;
}

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

  private holdSec = 0;

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

  kindOf(id: string | null): "mirror" | "source" | "obstacle" | null { return this.interaction.kindOf(id); }
  componentCenter(id: string | null): Vec2 | null { return this.interaction.componentCenter(id); }

  snapshot(): HudSnapshot {
    return {
      levelId: this.level.id,
      moves: this.moves,
      timeSec: this.elapsedSec,
      selectedId: this.selectedId,
      hoveredId: this.hoveredId,
      status: this.status,
      litTargets: this.targets.filter((target) => target.active).length,
      requiredTargets: this.targets.filter((target) => target.required).length,
      litSwitches: this.switches.filter((input) => input.active).length,
      openGates: this.gates.filter((gate) => !gateBlocks(gate.openFraction)).length,
      feedback: this.feedback,
      canUndo: this.interaction.canUndo,
    };
  }

  /** Completion freezes play input but still allows hover feedback. */
  apply(command: InputCommand): void {
    if (this.status === "complete" && command.type !== "hover") return;
    if (command.type === "reset") {
      this.reset();
      return;
    }
    this.interaction.apply(command);
  }

  /** Solves only when geometry changed, then advances switches, gates and target charge. */
  tick(dt: number): void {
    if (this.status === "complete" || !Number.isFinite(dt) || dt < 0) return;
    this.elapsedSec += dt;
    if (this.dirty) {
      this.result = solveOptics(this.opticsScene());
      this.solveCount += 1;
      this.dirty = false;
    }
    this.updateSwitchesAndGates(dt);
    this.updateTargets(dt);
  }

  private reset(): void {
    this.interaction.reset(initialGeometry(this.level));
    this.elapsedSec = 0;
    this.holdSec = 0;
    this.status = "playing";
    this.result = emptyResult();
    for (const input of this.switches) input.active = false;
    for (const gate of this.gates) gate.openFraction = 0;
    for (const target of this.targets) {
      target.chargeSec = 0;
      target.active = false;
    }
  }

  private opticsScene(): OpticsScene {
    const obstacles = [
      ...this.level.obstacles,
      ...this.movableObstacles.map((obstacle) => ({ id: obstacle.id, vertices: worldVertices(obstacle) })),
    ];
    return {
      sources: this.sources,
      mirrors: this.mirrors,
      obstacles,
      gates: this.gates,
      prisms: this.level.prisms,
      circles: [
        ...this.targets.map((target) => ({
          id: target.id, type: "target" as const, center: target.center, radius: target.radius,
        })),
        ...this.switches.map((input) => ({
          id: input.id, type: "switch" as const, center: input.center, radius: input.radius,
        })),
        ...this.sources.map((source) => ({
          id: source.id,
          type: "lamp" as const,
          center: source.position,
          radius: source.housingRadius ?? gameConfig.optics.lampHousingRadius,
        })),
      ],
    };
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
    let allRequiredActive = true;
    for (const target of this.targets) {
      const hit = this.result.events.find((event) => event.objectId === target.id);
      const lit = hit !== undefined && eventChargesTarget(hit, target);
      target.chargeSec = nextCharge(target.chargeSec, dt, lit);
      target.active = target.chargeSec >= gameConfig.targets.activationSec;
      if (target.required && !target.active) allRequiredActive = false;
    }
    const requiredCount = this.targets.filter((target) => target.required).length;
    if (requiredCount > 0 && allRequiredActive) {
      this.holdSec += dt;
      if (this.holdSec >= gameConfig.targets.completionHoldSec) this.status = "complete";
    } else {
      this.holdSec = 0;
    }
  }
}
