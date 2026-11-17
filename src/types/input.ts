// Commands are the only way pointer and keyboard listeners change engine state.
import type { Vec2 } from "./vec2";

export type InteractionFeedback = "locked" | "outsideRange";

export type InputCommand =
  | { type: "hover"; id: string | null }
  | { type: "select"; id: string | null }
  | { type: "beginRotate"; id: string }
  | { type: "rotateTo"; id: string; angleDeg: number }
  | { type: "endRotate"; id: string }
  | { type: "rotateStep"; direction: -1 | 1; fine: boolean }
  | { type: "beginDragObstacle"; id: string }
  | { type: "dragObstacleTo"; id: string; point: Vec2 }
  | { type: "endDragObstacle"; id: string }
  | { type: "undo" }
  | { type: "reset" };
