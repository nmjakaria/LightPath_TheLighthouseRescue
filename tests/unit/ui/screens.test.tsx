import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

import { ToastProvider } from "@/components/ui";
import { SETTINGS_SCHEMA } from "@/config/settingsSchema";
import { AboutContent } from "@/components/game/AboutContent";
import { HowToPlayContent } from "@/components/game/HowToPlayContent";
import { LevelSelection } from "@/components/game/LevelSelection";
import { MainMenu } from "@/components/game/MainMenu";
import { PlayRouteGate } from "@/components/game/PlayRouteGate";
import { RouteFade } from "@/components/game/RouteFade";
import { SettingsForm } from "@/components/settings/SettingsForm";

function render(node: ReactNode): string {
  return renderToStaticMarkup(<ToastProvider>{node}</ToastProvider>);
}

describe("main menu", () => {
  const html = render(<MainMenu />);

  it.each(["LightPath", "The Lighthouse Rescue", "Play", "Level Selection", "How to Play", "Settings", "About"])(
    "shows %s",
    (needle) => expect(html).toContain(needle),
  );

  it("exposes a labelled mute switch and a version label", () => {
    expect(html).toContain('role="switch"');
    expect(html).toContain("Audio on");
    expect(html).toContain("v0.1.0");
  });
});

describe("level selection", () => {
  const html = render(<LevelSelection />);

  it("renders all five level cards with their names", () => {
    for (const name of [
      "First Light",
      "The Broken Path",
      "Color of Hope",
      "The Dark Passage",
      "Lighthouse Rescue",
    ]) {
      expect(html).toContain(name);
    }
    expect(html).toContain("Best time");
    expect(html).toContain("Locked");
  });
});

describe("settings form", () => {
  const html = render(<SettingsForm />);

  it("renders every schema-driven control that is enabled by default", () => {
    for (const definition of SETTINGS_SCHEMA) {
      if (definition.group === "Developer / Demo") continue;
      expect(html).toContain(definition.label);
    }
    expect(html).toContain("Reset settings");
    expect(html).toContain("Reset progress");
    expect(html).not.toContain("Unlock all levels");
  });
});

describe("static information screens", () => {
  it("covers all four How to Play panels and the shortcut keys", () => {
    const html = render(<HowToPlayContent />);
    for (const heading of ["Goal", "Controls", "Component legend", "Scoring and hints"]) {
      expect(html).toContain(heading);
    }
    expect(html).toMatch(/<kbd[^>]*>Tab<\/kbd>/);
    expect(html).toContain("simplified model");
  });

  it("explains the simplified prism model and lists tool licenses", () => {
    const html = render(<AboutContent />);
    expect(html).toContain("simplified model");
    expect(html).toContain("SIL Open Font License 1.1");
    expect(html).toContain("MIT");
  });
});

describe("play route and transitions", () => {
  it("shows the loading state while client gating warms up", () => {
    expect(render(<PlayRouteGate levelId="level-99" />)).toContain("Lighting the lamp…");
  });

  it("uses a keyed 250 ms fade wrapper", () => {
    const html = render(<RouteFade>content</RouteFade>);
    expect(html).toContain("route-fade");
    expect(html).toContain("animation-duration:250ms");
    expect(html).toContain("content");
  });
});
