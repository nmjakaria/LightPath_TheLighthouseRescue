"use client";

/* Main menu (PRD FR-001/FR-002/FR-008). All controls are native buttons from the UI kit, so Tab
 * order follows visual order and Enter/Space work without extra key handling. */
import { useRouter } from "next/navigation";
import { version } from "../../../package.json";
import { Button, Toggle } from "@/components/ui";
import { useProgress } from "@/hooks/useProgress";
import { useSettings } from "@/hooks/useSettings";
import { firstPlayableLevel, hasProgress, levelRoute } from "@/game/levelNavigation";
import { ScreenShell } from "./ScreenShell";

export function MainMenu() {
  const router = useRouter();
  const { progress } = useProgress();
  const { settings, setSetting } = useSettings();
  const startIndex = firstPlayableLevel(progress, settings.demoUnlockAll);
  const actionLabel = hasProgress(progress) ? "Continue" : "Play";

  return (
    <ScreenShell>
      <div className="grid min-h-[80vh] items-center gap-12 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-1">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-beam">
              Computer Graphics Project
            </p>
            <h1 className="font-display text-6xl font-bold tracking-tight text-beam-core sm:text-7xl">
              LightPath
            </h1>
            <p className="font-display text-2xl text-cyan-beam">The Lighthouse Rescue</p>
            <p className="max-w-md text-base leading-relaxed text-mist">
              Turn mirrors, split light and guide every beam home.
            </p>
          </div>

          <div className="flex max-w-xs flex-col gap-3">
            <Button size="lg" onClick={() => router.push(levelRoute(startIndex))}>
              {actionLabel}
            </Button>
            <Button variant="secondary" onClick={() => router.push("/levels")}>
              Level Selection
            </Button>
            <Button variant="secondary" onClick={() => router.push("/how-to-play")}>
              How to Play
            </Button>
            <Button variant="ghost" onClick={() => router.push("/settings")}>
              Settings
            </Button>
            <Button variant="ghost" onClick={() => router.push("/about")}>
              About
            </Button>
          </div>

          <div className="flex items-center gap-3 text-sm text-mist">
            <Toggle
              label="Mute all audio"
              checked={settings.muted}
              onCheckedChange={(checked) => setSetting("muted", checked)}
            />
            <span>{settings.muted ? "Audio muted" : "Audio on"}</span>
          </div>
        </div>

        <div className="hidden space-y-4 lg:col-span-2 lg:block">
          <p className="font-display text-3xl text-soft-white">Five rooms of light and shadow.</p>
          <p className="max-w-xl text-base leading-relaxed text-mist">
            Each level introduces one optical idea: reflection, obstacles, color, switches and the
            lighthouse itself. The Inspector lets you see the mathematics while you play.
          </p>
          <p className="font-mono text-xs text-mist">v{version} · simplified optics model</p>
        </div>
      </div>
    </ScreenShell>
  );
}
