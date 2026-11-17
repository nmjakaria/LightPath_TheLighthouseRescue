/* TC-G13: the Inspector must print the tracer's own vectors, not an independent recreation of the
 * reflection formula. These tests read a solved Level 1 state and compare the snapshot with the
 * HitEvent that solveOptics produced. */
import { describe, expect, it } from "vitest";
import { GameState } from "@/engine/core/GameState";
import { formatNumber, formatVector, selectHitEvent } from "@/engine/core/inspector";
import { level01 } from "@/levels/level-01";
import { dot } from "@/lib/math/vec2";

describe("Optics Inspector data", () => {
  it("prints d, n and r from the selected solver hit (TC-G13)", () => {
    const state = new GameState(level01);
    state.tick(1 / 60);
    const solverHit = state.result.events.find((event) =>
      event.objectId === "M1" && event.incident && event.normal && event.reflected);
    expect(solverHit).toBeDefined();

    state.apply({ type: "select", id: "M1" });
    const hit = state.snapshot().inspector.hit;
    expect(hit?.objectId).toBe("M1");
    expect(hit?.incident).toEqual(solverHit?.incident);
    expect(hit?.normal).toEqual(solverHit?.normal);
    expect(hit?.reflected).toEqual(solverHit?.reflected);
    expect(hit?.point).toEqual(solverHit?.point);
    expect(hit?.dot).toBeCloseTo(dot(solverHit!.incident!, solverHit!.normal!));
    expect(hit?.incidenceDeg).toBeCloseTo(hit?.reflectionDeg ?? -1);
  });

  it("formats the exact vectors shown in the panel", () => {
    expect(formatVector({ x: 0.70710678, y: -0.70710678 })).toBe("(0.707, -0.707)");
    expect(formatNumber(0.5)).toBe("0.500");
    expect(formatVector(null)).toBe("—");
    expect(formatNumber(null)).toBe("—");
  });

  it("prefers a matching selected id, then a mirror, then any hit", () => {
    const state = new GameState(level01);
    state.tick(1 / 60);
    const events = state.result.events;
    expect(selectHitEvent(events, "M1")?.objectId).toBe("M1");
    expect(selectHitEvent(events, "missing")?.type).toBe("mirror");
    const selected = events[0];
    expect(selectHitEvent([selected], selected.objectId)?.objectId).toBe(selected.objectId);
    expect(selectHitEvent([], null)).toBeNull();
  });

  it("toggles presentation live, even while paused", () => {
    const state = new GameState(level01);
    expect(state.snapshot().inspector).toMatchObject({
      inspector: false, normalsOnly: false, glow: true, particles: true,
    });
    state.apply({ type: "toggleInspector" });
    state.apply({ type: "toggleNormals" });
    state.paused = true;
    state.apply({ type: "toggleGlow" });
    state.apply({ type: "toggleParticles" });
    expect(state.snapshot().inspector).toMatchObject({
      inspector: true, normalsOnly: true, glow: false, particles: false,
    });
  });
});
