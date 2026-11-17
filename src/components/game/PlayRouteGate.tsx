"use client";

/* Validates /play/[levelId] before the (future) game canvas mounts. LocalStorage progress is only
 * available after hydration, so gating waits for useClientReady to avoid false redirects. */
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { levelById } from "@/config/levelCatalog";
import { useToast } from "@/components/ui";
import { useClientReady } from "@/hooks/useClientReady";
import { useProgress } from "@/hooks/useProgress";
import { useSettings } from "@/hooks/useSettings";
import { lockedLevelMessage, parseLevelId } from "@/game/levelNavigation";
import { BackButton } from "./BackButton";
import { GameCanvas } from "./GameCanvas";
import { ScreenShell } from "./ScreenShell";

export function PlayRouteGate({ levelId }: { levelId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const ready = useClientReady();
  const { isLevelUnlocked } = useProgress();
  const { settings } = useSettings();
  const redirected = useRef(false);
  const index = parseLevelId(levelId);
  const level = index === null ? undefined : levelById(levelId);
  const unlocked = index !== null && (isLevelUnlocked(index) || settings.demoUnlockAll);

  useEffect(() => {
    if (!ready || redirected.current) return;
    if (index === null) {
      redirected.current = true;
      showToast("That level does not exist", "warning");
      router.replace("/levels");
      return;
    }
    if (!unlocked) {
      redirected.current = true;
      showToast(lockedLevelMessage(index), "warning");
      router.replace("/levels");
    }
  }, [ready, index, unlocked, router, showToast]);

  if (!ready || index === null || !unlocked) {
    return (
      <ScreenShell>
        <div role="status" aria-live="polite" className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
          <span className="h-4 w-4 animate-pulse rounded-full bg-star-gold" aria-hidden="true" />
          <p className="font-display text-2xl text-beam-core">Lighting the lamp…</p>
        </div>
      </ScreenShell>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-abyss">
      <GameCanvas />
      <div className="absolute left-4 top-4 z-10 rounded-card border border-navy-line bg-midnight/80 px-3 py-2">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-cyan-beam">
          Level {index} · {level?.name}
        </p>
        <BackButton href="/levels" label="Level selection" />
      </div>
    </div>
  );
}
