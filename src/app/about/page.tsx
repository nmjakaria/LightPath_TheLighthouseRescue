import { AboutContent } from "@/components/game/AboutContent";
import { BackButton } from "@/components/game/BackButton";
import { ScreenShell } from "@/components/game/ScreenShell";

export const metadata = { title: "About & Credits — LightPath" };

export default function AboutPage() {
  return (
    <ScreenShell>
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-beam">Project</p>
          <h1 className="font-display text-4xl font-semibold text-beam-core">About & Credits</h1>
        </div>
        <BackButton />
      </header>
      <AboutContent />
    </ScreenShell>
  );
}
