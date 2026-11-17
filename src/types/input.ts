// Commands are the only way pointer and keyboard listeners change engine state.
export type InputCommand =
  | { type: "hover"; id: string | null }
  | { type: "select"; id: string | null }
  | { type: "beginRotate"; id: string }
  | { type: "rotateTo"; id: string; angleDeg: number }
  | { type: "endRotate"; id: string }
  | { type: "rotateStep"; direction: -1 | 1; fine: boolean }
  | { type: "undo" }
  | { type: "reset" };
