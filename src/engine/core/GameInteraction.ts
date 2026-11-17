/*
 * Owns player-facing interaction state and bounded undo for all mutable geometry. Commands are the
 * only entry point; each committed action pushes one immutable snapshot and never refunds moves.
 * Locked components are still picked so the UI can show the PRD "thud" feedback (FR-023/§9.4).
 */
import { gameConfig } from "@/config/gameConfig";
import { axisCoordinate, constrainedPosition } from "@/game/movableObstacles";
import { restoreGeometry, snapshotGeometry, type GeometrySnapshot } from "@/game/geometry";
import { snapAngle } from "@/lib/math/angles";
import { FULL_TURN_DEG, MIRROR_PERIOD_DEG } from "@/lib/math/constants";
import { UndoStack } from "./UndoStack";
import type { InputCommand, InteractionFeedback } from "@/types/input";
import type { LevelMirrorConfig, MovableObstacleRuntime, SourceRuntime } from "@/types/level";
import type { Vec2 } from "@/types/vec2";

type RotatableRef =
  | { kind: "mirror"; item: LevelMirrorConfig; rotatable: boolean }
  | { kind: "source"; item: SourceRuntime; rotatable: boolean };

type RotateDrag = { id: string; before: GeometrySnapshot; originalAngleDeg: number };
type ObstacleDrag = { id: string; before: GeometrySnapshot; originalPosition: Vec2 };

export interface InteractionComponents {
  mirrors: LevelMirrorConfig[];
  sources: SourceRuntime[];
  movableObstacles: MovableObstacleRuntime[];
}

export interface InteractionOptions {
  components: InteractionComponents;
  stepDeg(): number;
  onGeometryChange(): void;
}

export class GameInteraction {
  selectedId: string | null = null;
  hoveredId: string | null = null;
  moves = 0;
  feedback: InteractionFeedback | null = null;
  rotateDrag: RotateDrag | null = null;
  obstacleDrag: ObstacleDrag | null = null;
  private readonly undo = new UndoStack<GeometrySnapshot>();

  constructor(private readonly options: InteractionOptions) {}

  get canUndo(): boolean {
    return this.undo.size > 0 || this.rotateDrag !== null || this.obstacleDrag !== null;
  }

  get dragId(): string | null { return this.rotateDrag?.id ?? null; }
  get obstacleDragId(): string | null { return this.obstacleDrag?.id ?? null; }

  kindOf(id: string | null): "mirror" | "source" | "obstacle" | null {
    if (!id) return null;
    const { mirrors, sources, movableObstacles } = this.options.components;
    if (mirrors.some((mirror) => mirror.id === id)) return "mirror";
    if (sources.some((source) => source.id === id)) return "source";
    if (movableObstacles.some((obstacle) => obstacle.id === id)) return "obstacle";
    return null;
  }

  componentCenter(id: string | null): Vec2 | null {
    const kind = this.kindOf(id);
    const { mirrors, sources, movableObstacles } = this.options.components;
    if (kind === "mirror") return mirrors.find((mirror) => mirror.id === id)?.center ?? null;
    if (kind === "source") return sources.find((source) => source.id === id)?.position ?? null;
    return movableObstacles.find((obstacle) => obstacle.id === id)?.position ?? null;
  }

  apply(command: InputCommand): void {
    switch (command.type) {
      case "hover": this.hoveredId = command.id; return;
      case "select":
        this.selectedId = command.id && this.kindOf(command.id) !== "obstacle" ? command.id : null;
        return;
      case "beginRotate": this.beginRotate(command.id); return;
      case "rotateTo": this.rotateTo(command.id, command.angleDeg); return;
      case "endRotate": this.commitDrag(command.id); return;
      case "rotateStep": this.rotateStep(command.direction, command.fine); return;
      case "beginDragObstacle": this.beginDragObstacle(command.id); return;
      case "dragObstacleTo": this.dragObstacleTo(command.id, command.point); return;
      case "endDragObstacle": this.endDragObstacle(command.id); return;
      case "undo": this.undoLast(); return;
      default: return;
    }
  }

  reset(snapshot: GeometrySnapshot): void {
    this.restore(snapshot);
    this.undo.clear();
    this.rotateDrag = null;
    this.obstacleDrag = null;
    this.selectedId = null;
    this.hoveredId = null;
    this.moves = 0;
    this.feedback = null;
  }

  private get components(): InteractionComponents { return this.options.components; }

  private findRotatable(id: string | null): RotatableRef | null {
    if (!id) return null;
    const mirror = this.components.mirrors.find((candidate) => candidate.id === id);
    if (mirror) return { kind: "mirror", item: mirror, rotatable: mirror.rotatable };
    const source = this.components.sources.find((candidate) => candidate.id === id);
    if (source) return { kind: "source", item: source, rotatable: source.rotatable };
    return null;
  }

  private angleOf(ref: RotatableRef): number {
    return ref.kind === "mirror" ? ref.item.angleDeg : ref.item.headingDeg;
  }

  private writeAngle(ref: RotatableRef, angleDeg: number): void {
    if (ref.kind === "mirror") ref.item.angleDeg = angleDeg;
    else ref.item.headingDeg = angleDeg;
  }

  private stepFor(fine: boolean): number {
    return fine ? Math.min(gameConfig.interaction.fineStepDeg, this.options.stepDeg()) : this.options.stepDeg();
  }

  private setAngle(id: string, angleDeg: number, fine: boolean): boolean {
    const ref = this.findRotatable(id);
    if (!ref) return false;
    if (!ref.rotatable) {
      this.feedback = "locked";
      return false;
    }
    const period = ref.kind === "mirror" ? MIRROR_PERIOD_DEG : FULL_TURN_DEG;
    const snapped = snapAngle(angleDeg, this.stepFor(fine), period);
    if (snapped === this.angleOf(ref)) return false;
    this.writeAngle(ref, snapped);
    this.options.onGeometryChange();
    return true;
  }

  private beginRotate(id: string): void {
    const ref = this.findRotatable(id);
    if (!ref) return;
    if (!ref.rotatable) {
      this.feedback = "locked";
      return;
    }
    this.selectedId = id;
    this.rotateDrag = { id, before: this.currentGeometry(), originalAngleDeg: this.angleOf(ref) };
  }

  private rotateTo(id: string, angleDeg: number): void {
    if (this.rotateDrag?.id === id) this.setAngle(id, angleDeg, false);
  }

  private commitDrag(id: string): void {
    const drag = this.rotateDrag;
    if (!drag || drag.id !== id) return;
    if (this.angleOfSafe(id) !== drag.originalAngleDeg) {
      this.undo.push(drag.before);
      this.moves += 1;
    }
    this.rotateDrag = null;
  }

  private angleOfSafe(id: string): number | null {
    const ref = this.findRotatable(id);
    return ref ? this.angleOf(ref) : null;
  }

  private rotateStep(direction: -1 | 1, fine: boolean): void {
    const ref = this.findRotatable(this.selectedId);
    if (!ref) return;
    const before = this.currentGeometry();
    const step = this.stepFor(fine) * direction;
    if (this.setAngle(this.selectedId as string, this.angleOf(ref) + step, fine)) {
      this.undo.push(before);
      this.moves += 1;
    }
  }

  private beginDragObstacle(id: string): void {
    const obstacle = this.components.movableObstacles.find((candidate) => candidate.id === id);
    if (!obstacle) return;
    this.selectedId = null;
    this.obstacleDrag = { id, before: this.currentGeometry(), originalPosition: { ...obstacle.position } };
  }

  private dragObstacleTo(id: string, point: Vec2): void {
    const drag = this.obstacleDrag;
    const obstacle = this.components.movableObstacles.find((candidate) => candidate.id === id);
    if (!drag || drag.id !== id || !obstacle) return;
    const [min, max] = obstacle.range;
    const requested = axisCoordinate(point, obstacle.axis);
    if (requested < min || requested > max) this.feedback = "outsideRange";
    const next = constrainedPosition(obstacle, point);
    if (next.x === obstacle.position.x && next.y === obstacle.position.y) return;
    obstacle.position = next;
    this.options.onGeometryChange();
  }

  private endDragObstacle(id: string): void {
    const drag = this.obstacleDrag;
    if (!drag || drag.id !== id) return;
    const obstacle = this.components.movableObstacles.find((candidate) => candidate.id === id);
    if (obstacle && (obstacle.position.x !== drag.originalPosition.x || obstacle.position.y !== drag.originalPosition.y)) {
      this.undo.push(drag.before);
      this.moves += 1;
    }
    this.obstacleDrag = null;
  }

  private currentGeometry(): GeometrySnapshot {
    const { mirrors, sources, movableObstacles } = this.components;
    return snapshotGeometry(mirrors, sources, movableObstacles);
  }

  private restore(snapshot: GeometrySnapshot): void {
    const { mirrors, sources, movableObstacles } = this.components;
    restoreGeometry(snapshot, mirrors, sources, movableObstacles);
    this.options.onGeometryChange();
  }

  private undoLast(): void {
    const drag = this.obstacleDrag ?? this.rotateDrag;
    if (drag) {
      this.restore(drag.before);
      this.obstacleDrag = null;
      this.rotateDrag = null;
      return;
    }
    const previous = this.undo.pop();
    if (previous) this.restore(previous);
  }
}
