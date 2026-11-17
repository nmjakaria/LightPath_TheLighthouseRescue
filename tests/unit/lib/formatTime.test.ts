import { describe, expect, it } from "vitest";
import { formatTime } from "@/lib/formatTime";

describe("formatTime", () => {
  it("formats seconds as zero-padded mm:ss", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(9)).toBe("00:09");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(600)).toBe("10:00");
  });

  it("floors fractional seconds", () => {
    expect(formatTime(59.9)).toBe("00:59");
  });

  it("shows an em dash for missing or invalid values", () => {
    expect(formatTime(null)).toBe("—");
    expect(formatTime(undefined)).toBe("—");
    expect(formatTime(Number.NaN)).toBe("—");
    expect(formatTime(-1)).toBe("—");
  });
});
