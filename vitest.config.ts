import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit-test configuration: Node environment only, with the same "@/..." alias as the app.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts", "src/engine/optics/**/*.ts", "src/game/**/*.ts"],
      thresholds: {
        "src/lib/math/**/*.ts": {
          lines: 90,
          statements: 90,
          branches: 90,
          functions: 90,
        },
        "src/engine/optics/**/*.ts": {
          lines: 90,
          statements: 90,
          branches: 90,
          functions: 90,
        },
      },
    },
  },
});
