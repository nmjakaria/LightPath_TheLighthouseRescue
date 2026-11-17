import { describe, expect, it } from "vitest";
import { uiConfig } from "@/config/uiConfig";
import { initialToastState, toastReducer } from "@/components/ui/toastState";

describe("toast queue", () => {
  it("adds messages with increasing ids", () => {
    const first = toastReducer(initialToastState, { type: "show", message: "One", tone: "info" });
    const second = toastReducer(first, { type: "show", message: "Two", tone: "success" });
    expect(second.items.map((item) => item.id)).toEqual([1, 2]);
    expect(second.items[1].tone).toBe("success");
    expect(second.nextId).toBe(3);
  });

  it("caps the queue at the configured maximum, keeping the newest messages", () => {
    let state = initialToastState;
    for (let i = 0; i < uiConfig.toast.maxVisible + 2; i += 1) {
      state = toastReducer(state, { type: "show", message: `Message ${i}`, tone: "info" });
    }
    expect(state.items).toHaveLength(uiConfig.toast.maxVisible);
    expect(state.items[state.items.length - 1].message).toBe(`Message ${uiConfig.toast.maxVisible + 1}`);
  });

  it("dismisses only the requested id", () => {
    const first = toastReducer(initialToastState, { type: "show", message: "One", tone: "info" });
    const second = toastReducer(first, { type: "show", message: "Two", tone: "info" });
    const dismissed = toastReducer(second, { type: "dismiss", id: 1 });
    expect(dismissed.items.map((item) => item.id)).toEqual([2]);
  });
});
