/*
 * Mutable engine state kept outside React. All changes arrive as commands, a dirty flag gates the
 * optics solve, and target charge is integrated with the clamped frame dt. Snapshots are small
 * immutable objects published to React at a low rate; React never renders per frame (PRD §12.8).
 */
import { gameConfig } from "@/config/gameConfig";
import { eventChargesTarget, nextCharge } from "@/game/targets";
import { MIRROR_PERIOD_DEG } from "@/lib/math/constants";
import { snapAngle } from "@/lib/math/angles";
import { solveOptics } from "@/engine/optics/tracer";
import { UndoStack } from "./UndoStack";
import type { InputCommand } from "@/types/input";
import type { LevelConfig, LevelMirrorConfig, TargetRuntime } from "@/types/level";
import type { OpticsResult, OpticsScene } from "@/types/optics";

interface GeometrySnapshot { angles: readonly number[] }
interface DragState { id: string; originalAngleDeg: number; before: GeometrySnapshot }

export interface HudSnapshot {
  levelId: string;
  moves: number;
  timeSec: number;
  selectedId: string | null;
  hoveredId: string | null;
  status: "playing" | "complete";
  litTargets: number;
  requiredTargets: number;
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
  readonly mirrors: LevelMirrorConfig[];
  readonly targets: TargetRuntime[];
  selectedId: string | null = null;
  hoveredId: string | null = null;
  moves = 0;
  elapsedSec = 0;
  status: "playing" | "complete" = "playing";
  dirty = true;
  solveCount = 0;
  result: OpticsResult = emptyResult();
  rotationStepDeg: number;

  private readonly undo = new UndoStack<GeometrySnapshot>();
  private drag: DragState | null = null;
  private holdSec = 0;

  constructor(
    readonly level: LevelConfig,
    rotationStepDeg: number = gameConfig.interaction.rotationStepDeg,
  ) {
    this.rotationStepDeg = rotationStepDeg;
    this.mirrors = level.mirrors.map((mirror) => ({ ...mirror }));
    this.targets = level.targets.map((target) => ({ ...target, chargeSec: 0, active: false }));
  }

  get dragId(): string | null {
    return this.drag?.id ?? null;
  }

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
      canUndo: this.undo.size > 0 || this.drag !== null,
    };
  }

  /** Single entry point for queued input; completion freezes play input but still allows hover. */
  apply(command: InputCommand): void {
    if (this.status === "complete" && command.type !== "hover") return;
    switch (command.type) {
      case "hover":
        this.hoveredId = command.id;
        return;
      case "select":
        this.selectedId = this.mirror(command.id) ? command.id : null;
        return;
      case "beginRotate":
        this.beginRotate(command.id);
        return;
      case "rotateTo":
        this.rotateTo(command.id, command.angleDeg);
        return;
      case "endRotate":
        this.commitDrag(command.id);
        return;
      case "rotateStep":
        this.rotateStep(command.direction, command.fine);
        return;
      case "undo":
        this.undoLast();
        return;
      case "reset":
        this.reset();
        return;
    }
  }

  /** Advances timers, solves only when geometry changed, then charges targets. */
  tick(dt: number): void {
    if (this.status === "complete" || !Number.isFinite(dt) || dt < 0) return;
    this.elapsedSec += dt;
    if (this.dirty) {
      this.result = solveOptics(this.opticsScene());
      this.solveCount += 1;
      this.dirty = false;
    }
    this.updateTargets(dt);
  }

  private mirror(id: string | null): LevelMirrorConfig | undefined {
    return this.mirrors.find((candidate) => candidate.id === id);
  }

  private stepFor(mirror: LevelMirrorConfig, fine: boolean): number {
    if (!fine) return this.level.rotationStepDeg ?? this.rotationStepDeg;
    return Math.min(gameConfig.interaction.fineStepDeg, this.rotationStepDeg);
  }

  private geometry(): GeometrySnapshot {
    return { angles: this.mirrors.map((mirror) => mirror.angleDeg) };
  }

  private restore(snapshot: GeometrySnapshot): void {
    this.mirrors.forEach((mirror, index) => {
      mirror.angleDeg = snapshot.angles[index];
    });
    this.dirty = true;
  }

  private setAngle(id: string, angleDeg: number, fine: boolean): boolean {
    const target = this.mirror(id);
    if (!target || !target.rotatable) return false;
    const snapped = snapAngle(angleDeg, this.stepFor(target, fine), MIRROR_PERIOD_DEG);
    if (snapped === target.angleDeg) return false;
    target.angleDeg = snapped;
    this.dirty = true;
    return true;
  }

  private beginRotate(id: string): void {
    const target = this.mirror(id);
    if (!target?.rotatable) return;
    this.selectedId = id;
    this.drag = { id, originalAngleDeg: target.angleDeg, before: this.geometry() };
  }

  private rotateTo(id: string, angleDeg: number): void {
    if (this.drag?.id !== id) return;
    this.setAngle(id, angleDeg, false);
  }

  private commitDrag(id: string): void {
    if (this.drag?.id !== id) return;
    const changed = this.mirror(id)?.angleDeg !== this.drag.originalAngleDeg;
    if (changed) {
      this.undo.push(this.drag.before);
      this.moves += 1;
    }
    this.drag = null;
  }

  private rotateStep(direction: -1 | 1, fine: boolean): void {
    const id = this.selectedId;
    if (!id) return;
    const target = this.mirror(id);
    if (!target?.rotatable) return;
    const before = this.geometry();
    const step = this.stepFor(target, fine);
    if (this.setAngle(id, target.angleDeg + direction * step, fine)) {
      this.undo.push(before);
      this.moves += 1;
    }
  }

  private undoLast(): void {
    if (this.drag) {
      this.restore(this.drag.before);
      this.drag = null;
      return;
    }
    const previous = this.undo.pop();
    if (previous) this.restore(previous);
  }

  private reset(): void {
    this.restore({ angles: this.level.mirrors.map((mirror) => mirror.angleDeg) });
    this.undo.clear();
    this.drag = null;
    this.selectedId = null;
    this.moves = 0;
    this.elapsedSec = 0;
    this.holdSec = 0;
    this.status = "playing";
    this.result = emptyResult();
    for (const target of this.targets) {
      target.chargeSec = 0;
      target.active = false;
    }
  }

  private opticsScene(): OpticsScene {
    return {
      sources: this.level.sources,
      mirrors: this.mirrors,
      obstacles: this.level.obstacles,
      circles: this.targets.map((target) => ({
        id: target.id,
        type: "target" as const,
        center: target.center,
        radius: target.radius,
      })),
    };
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
