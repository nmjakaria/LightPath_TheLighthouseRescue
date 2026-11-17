"use client";

/* Level cards (PRD FR-009/FR-010). Locked cards stay focusable so keyboard users receive the same
 * explanation as mouse users; the shake is skipped when reduced motion is requested. */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LEVEL_CATALOG, type LevelSummary } from "@/config/levelCatalog";
import { uiConfig } from "@/config/uiConfig";
import { Button, Card, cn, StarRating, useToast, type StarValue } from "@/components/ui";
import { useProgress } from "@/hooks/useProgress";
import { useSettings } from "@/hooks/useSettings";
import { formatTime } from "@/lib/formatTime";
import { levelRoute, lockedLevelMessage } from "@/game/levelNavigation";
import { BackButton } from "./BackButton";
import { LevelPreview } from "./LevelPreview";
import { ScreenShell } from "./ScreenShell";

export function LevelSelection() {
  const router = useRouter();
  const { progress, isLevelUnlocked } = useProgress();
  const { settings, effective } = useSettings();
  const { showToast } = useToast();
  const [shaking, setShaking] = useState<number | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
    };
  }, []);

  function openLevel(level: LevelSummary): void {
    if (isLevelUnlocked(level.index)) {
      router.push(levelRoute(level.index));
      return;
    }
    showToast(lockedLevelMessage(level.index), "warning");
    if (effective.reducedMotion) return;
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    setShaking(level.index);
    shakeTimer.current = setTimeout(() => setShaking(null), uiConfig.lockShakeMs);
  }

  return (
    <ScreenShell wide>
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-beam">Campaign</p>
          <h1 className="font-display text-4xl font-semibold text-beam-core">Level Selection</h1>
        </div>
        <BackButton />
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {LEVEL_CATALOG.map((level) => {
          const unlocked = isLevelUnlocked(level.index) || settings.demoUnlockAll;
          const record = progress.levels[level.id];
          const stars = (record?.best?.stars ?? 0) as StarValue;
          return (
            <Card
              key={level.id}
              title={`${level.index}. ${level.name}`}
              footer={`Best time ${formatTime(record?.bestTimeSec)}`}
              className={cn(
                "flex h-full flex-col",
                !unlocked && "opacity-60",
                shaking === level.index && "lock-shake",
              )}
              style={shaking === level.index ? { animationDuration: `${uiConfig.lockShakeMs}ms` } : undefined}
            >
              <div className="flex items-start gap-4">
                <LevelPreview kind={level.preview} />
                <p className="text-sm leading-relaxed text-mist">{level.objective}</p>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-navy-line pt-4">
                <StarRating value={stars} />
                <Button size="sm" variant={unlocked ? "primary" : "secondary"} onClick={() => openLevel(level)}>
                  {unlocked ? "Play" : "Locked"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </ScreenShell>
  );
}
