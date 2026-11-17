import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Reads the real token file so the check cannot drift from the palette used by components.
const tokens = Object.fromEntries(
  Array.from(readFileSync("src/styles/tokens.css", "utf8").matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)).map(
    (match) => [match[1], match[2]],
  ),
) as Record<string, string>;

function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
  const a = luminance(tokens[foreground]);
  const b = luminance(tokens[background]);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("token contrast (NFR-016)", () => {
  it.each([
    ["soft-white", "midnight"],
    ["abyss", "cyan-beam"],
    ["mist", "midnight"],
    ["soft-white", "deep-navy"],
    ["mist", "deep-navy"],
    ["abyss", "danger"],
    ["abyss", "star-gold"],
  ])("%s on %s is at least 4.5:1", (foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("matches the PRD claim that the primary pairs exceed 7:1", () => {
    expect(contrast("soft-white", "midnight")).toBeGreaterThan(7);
    expect(contrast("abyss", "cyan-beam")).toBeGreaterThan(7);
    expect(contrast("mist", "midnight")).toBeGreaterThan(4.5);
  });
});
