/* Pure toast queue logic kept separate from React so it can be unit-tested. The provider owns the
 * timers; this reducer only adds, caps and dismisses messages. */
import { uiConfig } from "@/config/uiConfig";

export type ToastTone = "info" | "success" | "warning" | "danger";

export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastState {
  nextId: number;
  items: ToastMessage[];
}

export const initialToastState: ToastState = { nextId: 1, items: [] };

export type ToastAction =
  | { type: "show"; message: string; tone: ToastTone }
  | { type: "dismiss"; id: number };

export function toastReducer(state: ToastState, action: ToastAction): ToastState {
  if (action.type === "dismiss") {
    return { ...state, items: state.items.filter((item) => item.id !== action.id) };
  }
  const item: ToastMessage = { id: state.nextId, message: action.message, tone: action.tone };
  const items = [...state.items, item];
  return {
    nextId: state.nextId + 1,
    items: items.slice(-uiConfig.toast.maxVisible),
  };
}
