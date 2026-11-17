"use client";

/* DOM HUD composed only from UI primitives. The engine publishes snapshots at 10 Hz, so this
 * component never reads the canvas or the game state directly (PRD FR-042/FR-045/FR-048). */
import { useState } from "react";
import { Button, Kbd, Panel } from "@/components/ui";
import { formatTime } from "@/lib/formatTime";
import type { HudSnapshot } from "@/engine/core/GameState";
import type { LevelConfig } from "@/types/level";

export interface GameHudProps {
  level: LevelConfig;
  snapshot: HudSnapshot;
  onPause(): void;
  onUndo(): void;
  onReset(): void;
  onHint(): void;
}

export function GameHud({ level, snapshot, onPause, onUndo, onReset, onHint }: GameHudProps) {
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const locked = snapshot.paused || snapshot.status === "complete";

  return (
    <Panel
      title={level.name}
      eyebrow={`Level ${level.index} · ${snapshot.paused ? "Paused" : snapshot.status}`}
      className="absolute left-4 top-4 z-10 w-72"
    >
      <p className="font-mono text-xs text-mist" aria-live="polite">
        {snapshot.moves} moves · {formatTime(snapshot.timeSec)} · {snapshot.litTargets}/{snapshot.requiredTargets} lit
      </p>
      {(snapshot.litSwitches > 0 || snapshot.openGates > 0) && (
        <p className="mt-1 font-mono text-xs text-mist">
          {snapshot.litSwitches} switches · {snapshot.openGates} gates open
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-mist">
        <span>{snapshot.hintsRemaining} hints left</span>
        <Button size="sm" variant="ghost" disabled={locked || snapshot.hintsRemaining === 0} onClick={onHint}>
          Hint (H)
        </Button>
      </div>
      {snapshot.hint && <p className="mt-1 text-xs text-star-gold">{snapshot.hint.text}</p>}
      {snapshot.feedback && (
        <p role="status" className="mt-1 text-xs text-warning">
          {snapshot.feedback === "locked" ? "That component is locked." : "The rock stays within its rail."}
        </p>
      )}
      {snapshot.needHint && !dismissedPrompt && !locked && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-button border border-warning px-2 py-1 text-xs text-warning">
          <span>Need a hint?</span>
          <button type="button" onClick={() => setDismissedPrompt(true)} className="underline">Dismiss</button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={locked || !snapshot.canUndo} onClick={onUndo}>Undo</Button>
        <Button size="sm" variant="secondary" disabled={locked} onClick={onReset}>Reset</Button>
        <Button size="sm" variant="ghost" onClick={onPause}>Pause</Button>
      </div>
      <p className="mt-3 text-xs text-mist">
        Drag ring · <Kbd>←</Kbd>/<Kbd>→</Kbd> rotate · <Kbd>Z</Kbd> undo · <Kbd>R</Kbd> reset · <Kbd>Esc</Kbd> pause
      </p>
    </Panel>
  );
}
