"use client";

/* React shell around the game runtime. The canvas stays purely visual; HUD, pause and result are
 * DOM components composed from UI primitives, and all engine access goes through the runtime hook. */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
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
import { InspectorPanel, recordFrame } from "./InspectorPanel";
import { LevelError } from "./LevelError";
import { OrientationNotice } from "./OrientationNotice";
import { PresentationControls } from "./PresentationControls";
import { PauseMenu } from "./PauseMenu";
import { TutorialToasts } from "./TutorialToasts";

export function GameCanvas({ levelId = "level-01" }: { levelId?: string }) {
  const { effective } = useSettings();
  const level = getLevelById(levelId);
  const validation = useMemo(
    () =>
      level
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
      colorblindAid={effective.colorblindAid}
      showFps={effective.showFps || features.fpsOverlay}
    />
  );
}

interface PlayableGameProps {
  level: LevelConfig;
  reducedMotion: boolean;
  rotationStepDeg: number;
  qualityPreset: QualityPresetValues;
  colorblindAid: boolean;
  showFps: boolean;
}

function PlayableGame({
  level,
  reducedMotion,
  rotationStepDeg,
  qualityPreset,
  colorblindAid,
  showFps,
}: PlayableGameProps) {
  const audio = useAudio();
  const runtime = useGameRuntime(level, reducedMotion, rotationStepDeg, qualityPreset, colorblindAid, audio);
  const { progress, recordCompletion, recordAttempt, markTutorialSeen } = useProgress();
  const { containerRef, canvasRef, snapshot, dispatch, getStats, getSelectableIds, getSelectedId } = runtime;
  const { onPointerDown, onPointerMove, onPointerUp, onPointerLeave } = runtime;
  const [stats, setStats] = useState({ fps: 0, frameMs: 0 });
  const saved = useRef(false);

  const onCanvasKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
      if (event.key !== "Tab") return;
      const ids = getSelectableIds();
      if (ids.length === 0) return;
      const index = ids.indexOf(getSelectedId() ?? "");
      const direction = event.shiftKey ? -1 : 1;
      if (direction === 1 && index === ids.length - 1) return;
      event.preventDefault();
      dispatch({ type: "cycleSelection", direction });
    },
    [dispatch, getSelectableIds, getSelectedId],
  );

  useEffect(() => {
    if (!showFps) return;
    const timer = setInterval(() => {
      const current = getStats();
      setStats({ fps: Math.round(current.fps), frameMs: Math.round(current.frameMs * 10) / 10 });
      recordFrame(current.frameMs);
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
        tabIndex={0}
        aria-label={`${level.name} optical puzzle. Drag or use arrow keys to rotate; drag a rock along its rail.`}
        aria-describedby="play-controls-help"
        className="block h-full w-full touch-none"
        onKeyDown={onCanvasKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        Your browser does not support Canvas 2D.
      </canvas>
      <p id="play-controls-help" className="sr-only">
        Press Tab to cycle components, left and right arrows to rotate, up and down arrows to slide
        a selected rock, Z to undo, R to reset and Escape to pause.
      </p>
      <OrientationNotice />
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
      <InspectorPanel inspector={snapshot.inspector} stats={stats} />
      <PresentationControls
        inspector={snapshot.inspector}
        dispatch={dispatch}
        onPause={() => dispatch({ type: "pauseToggle" })}
      />
      <FpsBadge visible={showFps && !snapshot.inspector.inspector} stats={stats} />
    </div>
  );
}

function FpsBadge({ visible, stats }: { visible: boolean; stats: { fps: number; frameMs: number } }) {
  if (!visible) return null;
  return (
    <p className="pointer-events-none absolute right-3 top-3 rounded-button border border-navy-line bg-midnight/80 px-2 py-1 font-mono text-xs text-mist">
      {stats.fps} FPS · {stats.frameMs} ms
    </p>
  );
}

function isFinished(snapshot: HudSnapshot): boolean {
  return snapshot.status === "complete" && snapshot.celebrationReady;
}
