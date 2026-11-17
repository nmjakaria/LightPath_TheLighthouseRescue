"use client";

/* Thin React shell around the game runtime: the canvas stays purely visual and the HUD is DOM
 * composed from UI primitives. All lifecycle and input rules live in useGameRuntime. */
import { useEffect, useState } from "react";
import { Button, Panel } from "@/components/ui";
import { features } from "@/config/features";
import { uiConfig } from "@/config/uiConfig";
import { useGameRuntime } from "@/hooks/useGameRuntime";
import { useSettings } from "@/hooks/useSettings";
import { getLevelById } from "@/levels";
import { level01 } from "@/levels/level-01";
import { BackButton } from "./BackButton";

export function GameCanvas({ levelId = "level-01" }: { levelId?: string }) {
  const { effective } = useSettings();
  const level = getLevelById(levelId) ?? level01;
  const runtime = useGameRuntime(level, effective.reducedMotion, effective.rotationStepDeg);
  const {
    containerRef,
    canvasRef,
    snapshot,
    dispatch,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    getStats,
  } = runtime;
  const showFps = effective.showFps || features.fpsOverlay;
  const [fps, setFps] = useState({ value: 0, frameMs: 0 });

  useEffect(() => {
    if (!showFps) return;
    const timer = setInterval(() => {
      const stats = getStats();
      setFps({ value: Math.round(stats.fps), frameMs: Math.round(stats.frameMs * 10) / 10 });
    }, uiConfig.fpsRefreshMs);
    return () => clearInterval(timer);
  }, [showFps, getStats]);

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-abyss">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${level.name} optical puzzle. Drag a mirror ring to rotate it.`}
        className="block h-full w-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        Your browser does not support Canvas 2D.
      </canvas>

      <Panel
        title={level.name}
        eyebrow={`Level ${level.index}`}
        className="absolute left-4 top-4 z-10 w-64"
      >
        <p aria-live="polite" className="font-mono text-xs text-mist">
          {snapshot.moves} moves · {snapshot.timeSec.toFixed(1)} s · {snapshot.litTargets}/
          {snapshot.requiredTargets} lit
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="secondary" disabled={!snapshot.canUndo} onClick={() => dispatch({ type: "undo" })}>
            Undo
          </Button>
          <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "reset" })}>
            Reset
          </Button>
        </div>
        <p className="mt-3 text-xs text-mist">Drag a ring · ←/→ rotate · Z undo · R reset</p>
        <div className="mt-3">
          <BackButton href="/levels" label="Level selection" />
        </div>
      </Panel>

      {snapshot.status === "complete" && (
        <Panel
          title="Lighthouse lit!"
          eyebrow="Level complete"
          className="absolute left-1/2 top-1/2 z-20 w-80 -translate-x-1/2 -translate-y-1/2 text-center"
        >
          <p>You brought light back to the first boat.</p>
        </Panel>
      )}

      {showFps && (
        <p className="pointer-events-none absolute right-3 top-3 rounded-button border border-navy-line bg-midnight/80 px-2 py-1 font-mono text-xs text-mist">
          {fps.value} FPS · {fps.frameMs} ms
        </p>
      )}
    </div>
  );
}
