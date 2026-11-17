"use client";

/* React shell around the game runtime. The canvas stays purely visual; HUD, pause and result are
 * DOM components composed from UI primitives, and all engine access goes through the runtime hook. */
import { useEffect, useMemo, useRef, useState } from "react";
import { features } from "@/config/features";
import { uiConfig } from "@/config/uiConfig";
import type { QualityPresetValues } from "@/config/gameConfig";
import type { HudSnapshot } from "@/engine/core/GameState";
import { useAudio } from "@/hooks/useAudio";
import { useGameRuntime } from "@/hooks/useGameRuntime";
import { useProgress } from "@/hooks/useProgress";
import { useSettings } from "@/hooks/useSettings";
import { getLevelById } from "@/levels";
import { validateLevel } from "@/game/levelValidator";
import type { LevelConfig } from "@/types/level";
import { CompletionDialog } from "./CompletionDialog";
import { GameHud } from "./GameHud";
import { LevelError } from "./LevelError";
import { PauseMenu } from "./PauseMenu";
import { TutorialToasts } from "./TutorialToasts";

export function GameCanvas({ levelId = "level-01" }: { levelId?: string }) {
  const { effective } = useSettings();
  const level = getLevelById(levelId);
  const validation = useMemo(
    () => level
      ? validateLevel(level)
      : {
          valid: false,
          errors: [{ path: "levelId", message: `unknown level "${levelId}"` }],
          warnings: [],
        },
    [level, levelId],
  );

  if (!level || !validation.valid) return <LevelError issues={validation.errors} />;
  return (
    <PlayableGame
      level={level}
      reducedMotion={effective.reducedMotion}
      rotationStepDeg={effective.rotationStepDeg}
      qualityPreset={effective.qualityPreset}
      showFps={effective.showFps || features.fpsOverlay}
    />
  );
}

interface PlayableGameProps {
  level: LevelConfig;
  reducedMotion: boolean;
  rotationStepDeg: number;
  qualityPreset: QualityPresetValues;
  showFps: boolean;
}

function PlayableGame({ level, reducedMotion, rotationStepDeg, qualityPreset, showFps }: PlayableGameProps) {
  const audio = useAudio();
  const runtime = useGameRuntime(level, reducedMotion, rotationStepDeg, qualityPreset, audio);
  const { progress, recordCompletion, recordAttempt, markTutorialSeen } = useProgress();
  const { containerRef, canvasRef, snapshot, dispatch, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, getStats } = runtime;
  const [fps, setFps] = useState({ value: 0, frameMs: 0 });
  const saved = useRef(false);

  useEffect(() => {
    if (!showFps) return;
    const timer = setInterval(() => {
      const stats = getStats();
      setFps({ value: Math.round(stats.fps), frameMs: Math.round(stats.frameMs * 10) / 10 });
    }, uiConfig.fpsRefreshMs);
    return () => clearInterval(timer);
  }, [showFps, getStats]);

  useEffect(() => {
    if (!isFinished(snapshot) || saved.current || !snapshot.completion) return;
    saved.current = true;
    recordAttempt(level.id);
    recordCompletion(snapshot.completion.record);
  }, [snapshot, level.id, recordAttempt, recordCompletion]);

  const replay = (): void => {
    saved.current = false;
    dispatch({ type: "pause", paused: false });
    dispatch({ type: "reset" });
  };

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-abyss">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${level.name} optical puzzle. Drag a mirror or lamp to rotate it; drag a rock along its rail.`}
        className="block h-full w-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        Your browser does not support Canvas 2D.
      </canvas>
      <GameHud
        level={level}
        snapshot={snapshot}
        onPause={() => dispatch({ type: "pauseToggle" })}
        onUndo={() => dispatch({ type: "undo" })}
        onReset={() => dispatch({ type: "reset" })}
        onHint={() => dispatch({ type: "hint" })}
      />
      <TutorialToasts
        levelId={level.id}
        tutorials={snapshot.tutorials}
        seen={progress.tutorialsSeen}
        onSeen={markTutorialSeen}
      />
      <PauseMenu
        snapshot={snapshot}
        onResume={() => dispatch({ type: "pause", paused: false })}
        onRestart={replay}
      />
      <CompletionDialog
        level={level}
        snapshot={snapshot}
        best={progress.levels[level.id]?.best ?? null}
        onReplay={replay}
      />
      {showFps && (
        <p className="pointer-events-none absolute right-3 top-3 rounded-button border border-navy-line bg-midnight/80 px-2 py-1 font-mono text-xs text-mist">
          {fps.value} FPS · {fps.frameMs} ms
        </p>
      )}
    </div>
  );
}

function isFinished(snapshot: HudSnapshot): boolean {
  return snapshot.status === "complete" && snapshot.celebrationReady;
}
