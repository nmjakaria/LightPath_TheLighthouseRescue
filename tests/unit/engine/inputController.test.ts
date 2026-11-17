import { describe, expect, it } from "vitest";
import { InputController, commandForKey } from "@/engine/core/InputController";

describe("InputController", () => {
  it("drains commands once in FIFO order", () => {
    const input = new InputController();
    input.enqueue({ type: "select", id: "M1" });
    input.enqueue({ type: "undo" });
    expect(input.pending).toBe(2);
    expect(input.drain()).toEqual([
      { type: "select", id: "M1" },
      { type: "undo" },
    ]);
    expect(input.drain()).toEqual([]);
  });

  it("maps arrow, Q/E, Z and R keys to commands with fine-step on Shift", () => {
    expect(commandForKey("ArrowRight", false)).toEqual({ type: "rotateStep", direction: 1, fine: false });
    expect(commandForKey("ArrowLeft", true)).toEqual({ type: "rotateStep", direction: -1, fine: true });
    expect(commandForKey("e", false)).toEqual({ type: "rotateStep", direction: 1, fine: false });
    expect(commandForKey("q", true)).toEqual({ type: "rotateStep", direction: -1, fine: true });
    expect(commandForKey("Z", false)).toEqual({ type: "undo" });
    expect(commandForKey("r", false)).toEqual({ type: "reset" });
    expect(commandForKey("F5", false)).toBeNull();
  });

  it("queues rapid input without dropping commands", () => {
    const input = new InputController();
    for (let index = 0; index < 100; index += 1) {
      input.enqueue({ type: "rotateStep", direction: 1, fine: false });
    }
    expect(input.drain()).toHaveLength(100);
  });
});
