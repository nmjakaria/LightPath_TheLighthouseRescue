"use client";

/* Bottom-right demo controls from PRD §14.2/FR-064. Buttons mirror the D/G/P/N keys, while U is
 * handled here because demo-unlock is a persisted setting rather than engine state. */
import { useEffect } from "react";
import { Button, Kbd, Toggle } from "@/components/ui";
import { features } from "@/config/features";
import { useSettings } from "@/hooks/useSettings";
import type { InspectorSnapshot } from "@/types/inspector";
import type { InputCommand } from "@/types/input";

export interface PresentationControlsProps {
  inspector: InspectorSnapshot;
  dispatch(command: InputCommand): void;
  onPause(): void;
}

export function PresentationControls({ inspector, dispatch, onPause }: PresentationControlsProps) {
  const { settings, setSetting } = useSettings();

  useEffect(() => {
    if (!features.demoUnlockAvailable) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== "u") return;
      const target = event.target;
      if (target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      event.preventDefault();
      setSetting("demoUnlockAll", !settings.demoUnlockAll);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSetting, settings.demoUnlockAll]);

  const variant = (active: boolean): "secondary" | "ghost" => active ? "secondary" : "ghost";
  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-wrap items-center justify-end gap-2 rounded-card border border-navy-line bg-midnight/80 px-3 py-2 backdrop-blur-sm">
      <Button size="sm" variant={variant(inspector.inspector)} onClick={() => dispatch({ type: "toggleInspector" })}>
        Inspector <Kbd>D</Kbd>
      </Button>
      <Button size="sm" variant={variant(inspector.glow)} onClick={() => dispatch({ type: "toggleGlow" })}>
        Glow <Kbd>G</Kbd>
      </Button>
      <Button size="sm" variant={variant(inspector.particles)} onClick={() => dispatch({ type: "toggleParticles" })}>
        Particles <Kbd>P</Kbd>
      </Button>
      <Button size="sm" variant={variant(inspector.normalsOnly)} onClick={() => dispatch({ type: "toggleNormals" })}>
        Normals <Kbd>N</Kbd>
      </Button>
      {features.demoUnlockAvailable && (
        <Button size="sm" variant={variant(settings.demoUnlockAll)}
          onClick={() => setSetting("demoUnlockAll", !settings.demoUnlockAll)}>
          Unlock <Kbd>U</Kbd>
        </Button>
      )}
      <Toggle label="Mute all audio" checked={settings.muted}
        onCheckedChange={(checked) => setSetting("muted", checked)} />
      <Button size="sm" variant="ghost" onClick={onPause}>Pause <Kbd>Esc</Kbd></Button>
    </div>
  );
}
