import { Panel } from "@/components/ui";

const CREDITS = [
  ["Graphics & engine", "Mirror transforms, ray tracing and rendering"],
  ["Gameplay & levels", "Targets, switches, scoring and five puzzles"],
  ["UI & accessibility", "Menus, keyboard controls and visual clarity"],
  ["Audio & polish", "Synthesized cues, particles and atmosphere"],
] as const;

const TOOLS = [
  ["Next.js, React, TypeScript", "MIT"],
  ["Tailwind CSS", "MIT"],
  ["Space Grotesk, Inter, JetBrains Mono", "SIL Open Font License 1.1"],
  ["Canvas 2D & Web Audio", "Browser platform APIs"],
] as const;

export function AboutContent() {
  return (
    <div className="space-y-6">
      <Panel title="About LightPath" eyebrow="Computer Graphics course project">
        <p className="text-mist">
          LightPath is a 2D optical puzzle game built to demonstrate affine transforms, vector
          reflection, iterative ray tracing and additive light. Rescue the lighthouse by solving
          five rooms, from a pair of mirrors to a prism, switch and gate finale.
        </p>
      </Panel>

      <Panel title="A note on the optics" eyebrow="Educational model">
        <p className="text-mist">
          Reflection uses the exact vector rule r = d − 2(d·n)n. The prism is a{" "}
          <span className="text-soft-white">simplified model</span>: mixed white light is split into
          red, green and blue children at fixed deviations of −12°, 0° and +12° rather than being
          simulated with wavelength-dependent refraction.
        </p>
      </Panel>

      <Panel title="Team roles" eyebrow="Credits">
        <ul className="grid gap-2 sm:grid-cols-2">
          {CREDITS.map(([role, detail]) => (
            <li key={role} className="rounded-card border border-navy-line px-3 py-2">
              <p className="font-display font-semibold text-soft-white">{role}</p>
              <p className="text-sm text-mist">{detail}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Tools and licenses" eyebrow="Credits">
        <ul className="space-y-2">
          {TOOLS.map(([tool, license]) => (
            <li key={tool} className="flex flex-wrap justify-between gap-2 border-b border-navy-line pb-2 last:border-0">
              <span className="text-soft-white">{tool}</span>
              <span className="font-mono text-sm text-mist">{license}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
