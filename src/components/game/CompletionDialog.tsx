"use client";

/* Result overlay from PRD FR-047/FR-016. Values come from the engine's frozen completion record,
 * while best values come from the progress store after the single save in GameCanvas. */
import { useRouter } from "next/navigation";
import { Button, Modal, StarRating } from "@/components/ui";
import type { HudSnapshot } from "@/engine/core/GameState";
import { levelRoute } from "@/game/levelNavigation";
import { formatTime } from "@/lib/formatTime";
import type { LevelConfig } from "@/types/level";
import type { ScoreRecord } from "@/types/progress";

export interface CompletionDialogProps {
  level: LevelConfig;
  snapshot: HudSnapshot;
  best: ScoreRecord | null;
  onReplay(): void;
}

export function CompletionDialog({ level, snapshot, best, onReplay }: CompletionDialogProps) {
  const router = useRouter();
  const completion = snapshot.completion;
  if (snapshot.status !== "complete" || !snapshot.celebrationReady || !completion) return null;

  const { record, result } = completion;
  const isFinale = level.index >= 5;
  const shownBest = best ?? record;

  return (
    <Modal
      open
      onClose={() => router.push("/levels")}
      title={isFinale ? "The great lamp is lit!" : "Lighthouse lit!"}
      className="max-w-md text-center"
      footer={
        <>
          <Button variant="secondary" onClick={onReplay}>Replay</Button>
          <Button variant="ghost" onClick={() => router.push("/levels")}>Level Selection</Button>
          {isFinale ? (
            <Button onClick={() => router.push("/")}>Main Menu</Button>
          ) : (
            <Button onClick={() => router.push(levelRoute(level.index + 1))}>Next Level</Button>
          )}
        </>
      }
    >
      <StarRating value={record.stars} className="justify-center" />
      <p className="mt-4 font-display text-4xl font-bold text-beam-core">{record.score} points</p>
      <dl className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-2 text-left font-mono text-xs text-mist">
        <dt>Time</dt><dd className="text-right text-soft-white">{formatTime(record.timeSec)}</dd>
        <dt>Moves</dt><dd className="text-right text-soft-white">{record.moves}</dd>
        <dt>Hints</dt><dd className="text-right text-soft-white">{record.hintsUsed}</dd>
        <dt>Penalties</dt>
        <dd className="text-right text-soft-white">
          {result.timePenalty} + {result.movePenalty} + {result.hintPenalty}
        </dd>
        <dt>Best</dt>
        <dd className="text-right text-soft-white">{shownBest.score} · {formatTime(shownBest.timeSec)}</dd>
      </dl>
      {isFinale && (
        <p className="mt-4 text-sm text-cyan-beam">Every boat is safe. The lighthouse shines again.</p>
      )}
    </Modal>
  );
}
