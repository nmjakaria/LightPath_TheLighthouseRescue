import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { ToastProvider } from "@/components/ui";
import { GameHud } from "@/components/game/GameHud";
import { OrientationNotice } from "@/components/game/OrientationNotice";
import RouteError from "@/app/error";
import { GameState } from "@/engine/core/GameState";
import { testLevel } from "../game/fixtures";

function render(node: ReactNode): string {
  return renderToStaticMarkup(<ToastProvider>{node}</ToastProvider>);
}

const hud = render(
  <GameHud
    level={testLevel({ name: "Test Scene" })}
    snapshot={new GameState(testLevel()).snapshot()}
    onPause={() => {}}
    onUndo={() => {}}
    onReset={() => {}}
    onHint={() => {}}
  />,
);

describe("game accessibility (NFR-015–017)", () => {
  it("exposes one polite live status region and never attaches it to the timer", () => {
    expect(hud).toContain('role="status"');
    expect(hud).toContain('aria-live="polite"');
    expect(hud).toContain('aria-atomic="true"');
    expect(hud).toContain("Target 0 of 0 lit.");
    expect(hud).not.toMatch(/aria-live="polite"[^>]*>[^<]*moves/);
  });

  it("documents the keyboard map and the non-colour target cues on screen", () => {
    expect(hud).toContain("Tab");
    expect(hud).toContain("Target shapes: ▲ red · ● green · ■ blue");
  });

  it("shows a portrait-only rotate notice through CSS", () => {
    expect(render(<OrientationNotice />)).toContain("Rotate your device");
    const css = readFileSync(new URL("../../../src/app/globals.css", import.meta.url), "utf8");
    expect(css).toContain(".orientation-notice");
    expect(css).toMatch(/@media \(orientation: portrait\)/);
  });

  it("keeps two recovery paths on the route error boundary", () => {
    const html = render(<RouteError error={new Error("boom")} reset={() => {}} />);
    expect(html).toContain("Try again");
    expect(html).toContain("Main menu");
  });
});
