"use client";

/* Pause overlay from PRD FR-017. The Modal primitive owns Esc, focus trap and focus return; the
 * engine has already stopped the timer before this component becomes visible. */
import { useRouter } from "next/navigation";
import { Button, Kbd, Modal } from "@/components/ui";
import type { HudSnapshot } from "@/engine/core/GameState";

export interface PauseMenuProps {
  snapshot: HudSnapshot;
  onResume(): void;
  onRestart(): void;
}

export function PauseMenu({ snapshot, onResume, onRestart }: PauseMenuProps) {
  const router = useRouter();

  return (
    <Modal
      open={snapshot.paused}
      onClose={onResume}
      title="Paused"
      className="max-w-md"
      footer={<Button onClick={onResume}>Resume</Button>}
    >
      <p className="text-sm text-mist">The timer and beams are frozen. Resume to continue exactly where you were.</p>
      <div className="mt-5 grid gap-2">
        <Button variant="secondary" onClick={onRestart}>Restart level</Button>
        <Button variant="secondary" onClick={() => router.push("/how-to-play")}>How to Play</Button>
        <Button variant="secondary" onClick={() => router.push("/settings")}>Settings</Button>
        <Button variant="secondary" onClick={() => router.push("/levels")}>Level Selection</Button>
        <Button variant="ghost" onClick={() => router.push("/")}>Main Menu</Button>
      </div>
      <p className="mt-5 text-xs text-mist">
        Shortcuts: <Kbd>H</Kbd> hint · <Kbd>Z</Kbd> undo · <Kbd>R</Kbd> reset · <Kbd>Esc</Kbd> resume
      </p>
    </Modal>
  );
}
