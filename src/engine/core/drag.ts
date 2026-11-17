/* Pointer drag intent shared by the runtime's pointer handlers. The ref shape is deliberately
 * minimal so this helper stays framework-agnostic and can be unit-tested without React. */
import type { GameState } from "./GameState";

export type DragMode = "rotate" | "obstacle";
export interface PendingDrag {
  id: string;
  mode: DragMode;
}
export interface DragRef {
  current: PendingDrag | null;
}

export function pendingDrag(state: GameState, ref: DragRef): PendingDrag | null {
  if (ref.current) return ref.current;
  if (state.obstacleDragId) return { id: state.obstacleDragId, mode: "obstacle" };
  return state.dragId ? { id: state.dragId, mode: "rotate" } : null;
}
