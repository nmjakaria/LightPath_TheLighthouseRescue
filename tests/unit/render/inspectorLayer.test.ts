/* InspectorLayer tests use a recording Canvas stub: no browser, but they prove the overlay reacts
 * to D/N toggles and prints solver-derived hit numbers and frame statistics. */
import { describe, expect, it } from "vitest";
import { GameState } from "@/engine/core/GameState";
import type { FrameContext } from "@/engine/render/Layer";
import { InspectorLayer } from "@/engine/render/layers/InspectorLayer";
import type { Palette } from "@/engine/render/palette";
import { ViewTransform } from "@/engine/core/ViewTransform";
import { level01 } from "@/levels/level-01";

const palette = {
  abyss: "#040813", midnight: "#0a1530", deepNavy: "#11224a", navyLine: "#26417a",
  cyanBeam: "#22d3ee", oceanTeal: "#14b8a6", beamCore: "#e6fbff", softWhite: "#f1f7ff",
  mist: "#9fb3d1", starGold: "#ffd166", lightRed: "#ff4d6d", lightGreen: "#4dff9f",
  lightBlue: "#4d9bff", success: "#34d399", warning: "#fbbf24", danger: "#f87171",
} satisfies Palette;

function recordingContext() {
  const calls = { stroke: 0, fill: 0, arc: 0, text: [] as string[] };
  const ctx = {
    font: "", lineWidth: 1, strokeStyle: "", fillStyle: "", globalAlpha: 1,
    save() {}, restore() {},
    setLineDash() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
    stroke() { calls.stroke += 1; },
    fill() { calls.fill += 1; },
    arc() { calls.arc += 1; },
    fillText(text: string) { calls.text.push(text); },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

function frame(ctx: CanvasRenderingContext2D): FrameContext {
  return {
    ctx,
    view: new ViewTransform(),
    stats: { elapsedSec: 1, dt: 1 / 60, frameMs: 12.5, fps: 60, frames: 60 },
  };
}

function solvedState(): GameState {
  const state = new GameState(level01);
  state.tick(1 / 60);
  state.apply({ type: "select", id: "M1" });
  return state;
}

describe("InspectorLayer", () => {
  it("draws nothing until the Inspector is enabled", () => {
    const { ctx, calls } = recordingContext();
    new InspectorLayer(palette, solvedState()).draw(frame(ctx));
    expect(calls.stroke).toBe(0);
    expect(calls.text).toEqual([]);
  });

  it("draws hit points, vectors, arcs and the frame badge (FR-041)", () => {
    const state = solvedState();
    state.apply({ type: "toggleInspector" });
    const { ctx, calls } = recordingContext();
    new InspectorLayer(palette, state).draw(frame(ctx));
    expect(calls.arc).toBeGreaterThan(0);
    expect(calls.stroke).toBeGreaterThan(0);
    expect(calls.text.some((text) => text.startsWith("FPS 60"))).toBe(true);
    expect(calls.text).toContain("0");
  });

  it("hides hit labels and arcs in normals-only mode (FR-064)", () => {
    const state = solvedState();
    state.apply({ type: "toggleInspector" });
    state.apply({ type: "toggleNormals" });
    const { ctx, calls } = recordingContext();
    new InspectorLayer(palette, state).draw(frame(ctx));
    expect(calls.stroke).toBeGreaterThan(0);
    expect(calls.arc).toBe(0);
    expect(calls.text).toHaveLength(1);
  });
});
