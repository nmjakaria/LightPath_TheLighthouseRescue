import { BackButton } from "@/components/game/BackButton";
import { HowToPlayContent } from "@/components/game/HowToPlayContent";
import { ScreenShell } from "@/components/game/ScreenShell";

export const metadata = { title: "How to Play — LightPath" };

export default function HowToPlayPage() {
  return (
    <ScreenShell>
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-beam">Guidebook</p>
          <h1 className="font-display text-4xl font-semibold text-beam-core">How to Play</h1>
        </div>
        <BackButton />
      </header>
      <HowToPlayContent />
    </ScreenShell>
  );
}
