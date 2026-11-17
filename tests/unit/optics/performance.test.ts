import { describe, expect, it } from "vitest";
import { solveOptics } from "@/engine/optics/tracer";
import { fourMirrorScene } from "./scenes";

describe("optics solve cost", () => {
  it("solves a typical four-mirror scene in under 2 ms on average", () => {
    const input = fourMirrorScene();
    for (let index = 0; index < 20; index += 1) solveOptics(input);

    const sampleCount = 500;
    const times: number[] = [];
    for (let index = 0; index < sampleCount; index += 1) {
      const started = performance.now();
      solveOptics(input);
      times.push(performance.now() - started);
    }
    times.sort((a, b) => a - b);
    const total = times.reduce((sum, value) => sum + value, 0);
    const average = total / sampleCount;
    const p95 = times[Math.floor(sampleCount * 0.95)];
    console.log(
      `[optics] 4-mirror solve: avg ${average.toFixed(4)} ms, p95 ${p95.toFixed(4)} ms, max ${times[sampleCount - 1].toFixed(4)} ms (${sampleCount} runs)`,
    );
    expect(average).toBeLessThan(2);
  });
});
