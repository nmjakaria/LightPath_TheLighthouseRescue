import { Kbd, Panel } from "@/components/ui";
import { ComponentIcon, type ComponentKind } from "./ComponentIcon";

const LEGEND: ReadonlyArray<{ kind: ComponentKind; name: string; detail: string }> = [
  { kind: "lamp", name: "Lamp", detail: "Emits a beam; some lamps can also be aimed." },
  { kind: "mirror", name: "Mirror", detail: "Drag its ring to rotate; the beam turns twice as far." },
  { kind: "prism", name: "Prism", detail: "Splits mixed light into red, green and blue (simplified model)." },
  { kind: "target", name: "Target", detail: "Charges when the correct color reaches it." },
  { kind: "switch", name: "Switch", detail: "Opens a gate while it is lit." },
  { kind: "gate", name: "Gate", detail: "Blocks the beam until its switch is powered." },
  { kind: "obstacle", name: "Obstacle", detail: "Absorbs the beam; some can be dragged on a rail." },
];

const SHORTCUTS = [
  ["Select next component", "Tab"],
  ["Rotate a selected mirror", "← →"],
  ["Fine rotation", "Shift + arrows"],
  ["Undo", "Z"],
  ["Reset the level", "R"],
  ["Hint", "H"],
  ["Pause", "Esc"],
] as const;

export function HowToPlayContent() {
  return (
    <div className="space-y-6">
      <Panel title="Goal" eyebrow="The rescue">
        <p className="text-mist">
          Guide light from each lamp to every target. Light the required boats at the same time for
          <span className="text-soft-white"> 0.6 seconds</span> to finish the level.
        </p>
      </Panel>

      <Panel title="Controls" eyebrow="Mouse and keyboard">
        <p className="mb-4 text-mist">
          Click or hover a component to select it, then drag its ring. Keyboard players can tab
          through components and use the arrow keys.
        </p>
        <dl className="grid gap-2 sm:grid-cols-2">
          {SHORTCUTS.map(([action, keys]) => (
            <div key={action} className="flex items-center justify-between gap-3 rounded-card border border-navy-line px-3 py-2">
              <dt className="text-sm text-soft-white">{action}</dt>
              <dd className="flex gap-1">
                {keys.split(" + ").map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title="Component legend" eyebrow="Know your tools">
        <ul className="grid gap-3 sm:grid-cols-2">
          {LEGEND.map((item) => (
            <li key={item.kind} className="flex items-start gap-3">
              <ComponentIcon kind={item.kind} />
              <div>
                <p className="font-display font-semibold text-soft-white">{item.name}</p>
                <p className="text-sm text-mist">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Scoring and hints" eyebrow="Three stars">
        <p className="text-mist">
          Score starts at 1000 and loses points for time, moves and hints; three stars need at least
          800. Each level has three hints, revealed one tier at a time, and every hint costs 100
          points.
        </p>
      </Panel>
    </div>
  );
}
