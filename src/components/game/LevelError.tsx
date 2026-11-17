"use client";

/* Readable failure screen for PRD FR-012 / TC-E08: malformed level data is described, never thrown
 * into the canvas. The Back button always leaves the broken level. */
import { Panel } from "@/components/ui";
import type { ValidationIssue } from "@/game/levelValidator";
import { BackButton } from "./BackButton";
import { ScreenShell } from "./ScreenShell";

export function LevelError({ issues }: { issues: readonly ValidationIssue[] }) {
  return (
    <ScreenShell>
      <Panel title="This level could not load" eyebrow="Level data error" className="mx-auto max-w-2xl">
        <p className="text-sm text-mist">
          The configuration is invalid, so the game stopped safely instead of showing a broken scene.
        </p>
        <ul className="mt-4 space-y-2 font-mono text-xs text-warning">
          {issues.map((issue, index) => (
            <li key={`${issue.path}-${index}`}>
              <span className="text-soft-white">{issue.path}</span> — {issue.message}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <BackButton href="/levels" label="Back to level selection" />
        </div>
      </Panel>
    </ScreenShell>
  );
}
