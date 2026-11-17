import { describe, expect, it } from "vitest";
import { cn } from "@/components/ui/cn";

describe("cn", () => {
  it("joins truthy classes and drops falsy values", () => {
    expect(cn("a", undefined, null, false, "", "b")).toBe("a b");
  });

  it("flattens nested arrays of classes", () => {
    expect(cn("base", ["sm", ["lg", false]], "last")).toBe("base sm lg last");
  });

  it("returns an empty string for an empty call", () => {
    expect(cn()).toBe("");
  });
});
