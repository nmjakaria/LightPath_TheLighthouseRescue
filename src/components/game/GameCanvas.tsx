"use client";

/* Thin React shell around the canvas runtime: the overlay is DOM so it stays accessible and the
 * canvas stays purely visual. All lifecycle rules live in useCanvasRuntime. */
import { useEffect, useState } from "react";
import { features } from "@/config/features";
import { uiConfig } from "@/config/uiConfig";
import { useCanvasRuntime } from "@/hooks/useCanvasRuntime";
import { useSettings } from "@/hooks/useSettings";

export function GameCanvas() {
  const { effective } = useSettings();
  const showFps = effective.showFps || features.fpsOverlay;
  const { containerRef, canvasRef, pointerWorld, setPointer, getStats } = useCanvasRuntime(
    effective.reducedMotion,
  );
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
        aria-label="Preview of the first optical puzzle scene"
        className="block h-full w-full"
        onPointerMove={(event) => setPointer(pointerWorld(event))}
        onPointerDown={(event) => setPointer(pointerWorld(event))}
        onPointerLeave={() => setPointer(null)}
      >
        Your browser does not support Canvas 2D.
      </canvas>
      {showFps && (
        <p className="pointer-events-none absolute right-3 top-3 rounded-button border border-navy-line bg-midnight/80 px-2 py-1 font-mono text-xs text-mist">
          {fps.value} FPS · {fps.frameMs} ms
        </p>
      )}
    </div>
  );
}
