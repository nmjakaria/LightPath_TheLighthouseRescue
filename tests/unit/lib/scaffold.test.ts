import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Guards the Step 1 scaffold: the PRD palette and the required npm scripts must exist.
const tokens = readFileSync(new URL("../../../src/styles/tokens.css", import.meta.url), "utf8");
const packageJson = JSON.parse(
  readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
) as { scripts: Record<string, string> };

const palette = {
  abyss: "#040813",
  midnight: "#0a1530",
  "deep-navy": "#11224a",
  "navy-line": "#26417a",
  "cyan-beam": "#22d3ee",
  "ocean-teal": "#14b8a6",
  "beam-core": "#e6fbff",
  "soft-white": "#f1f7ff",
  mist: "#9fb3d1",
  "light-red": "#ff4d6d",
  "light-green": "#4dff9f",
  "light-blue": "#4d9bff",
  "star-gold": "#ffd166",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
} as const;

describe("Step 1 scaffold", () => {
  it("defines every PRD palette token", () => {
    for (const [name, hex] of Object.entries(palette)) {
      expect(tokens.toLowerCase()).toContain(`--${name}: ${hex}`);
    }
  });

  it("exposes every gate script", () => {
    expect(Object.keys(packageJson.scripts)).toEqual(
      expect.arrayContaining(["dev", "build", "start", "lint", "typecheck", "test", "test:coverage"]),
    );
  });
});
