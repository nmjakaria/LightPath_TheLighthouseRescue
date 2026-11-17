import { describe, expect, it } from "vitest";
import { UNDO_LIMIT } from "@/lib/math/constants";
import { UndoStack } from "@/engine/core/UndoStack";

describe("UndoStack", () => {
  it("restores snapshots in LIFO order", () => {
    const stack = new UndoStack<number>();
    stack.push(1);
    stack.push(2);
    expect(stack.size).toBe(2);
    expect(stack.pop()).toBe(2);
    expect(stack.pop()).toBe(1);
    expect(stack.pop()).toBeUndefined();
  });

  it(`discards the oldest of more than ${UNDO_LIMIT} entries`, () => {
    const stack = new UndoStack<number>();
    for (let value = 0; value < UNDO_LIMIT + 10; value += 1) stack.push(value);
    expect(stack.size).toBe(UNDO_LIMIT);
    expect(stack.pop()).toBe(UNDO_LIMIT + 9);
    for (let index = 0; index < UNDO_LIMIT - 2; index += 1) stack.pop();
    expect(stack.pop()).toBe(10);
    expect(stack.pop()).toBeUndefined();
  });

  it("clear empties the stack", () => {
    const stack = new UndoStack<string>();
    stack.push("a");
    stack.clear();
    expect(stack.size).toBe(0);
  });
});
