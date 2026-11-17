"use client";

import {
  Button,
  Card,
  IconButton,
  Kbd,
  Panel,
  ProgressRing,
  Section,
  Stack,
  StarRating,
  Tooltip,
} from "@/components/ui";
import { InteractiveShowcase } from "./InteractiveShowcase";

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M19 5l-3 3M8 16l-3 3" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

export function UiShowcase() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 p-8">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-cyan-beam">Development only</p>
        <h1 className="font-display text-4xl font-bold text-beam-core">UI primitives</h1>
        <p className="text-base text-mist">All variants and states of the reusable kit, composed with tokens only.</p>
      </header>

      <Section title="Buttons" description="Four variants, three sizes, icon support, disabled and loading.">
        <Stack direction="row" gap={2} wrap>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </Stack>
        <Stack direction="row" gap={2} wrap>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button iconLeft={<UndoIcon />}>With icon</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </Stack>
        <Stack direction="row" gap={2} wrap>
          <IconButton label="Settings" icon={<GearIcon />} />
          <IconButton label="Undo" icon={<UndoIcon />} variant="primary" />
          <IconButton label="Reset" icon={<UndoIcon />} variant="ghost" />
          <IconButton label="Delete" icon={<GearIcon />} variant="danger" disabled />
        </Stack>
      </Section>

      <Section title="Containers" description="Cards and translucent panels.">
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Card">Default card body.</Card>
          <Card title="Interactive" interactive>Hover shows the cyan outline.</Card>
          <Card title="With footer" footer="Footer text">Body with a divider.</Card>
        </div>
        <Panel eyebrow="HUD" title="Panel">80% Midnight with a soft blur.</Panel>
      </Section>

      <Section title="Status and indicators" description="Stars, rings, keyboard keys and tooltips.">
        <Stack direction="row" gap={3} wrap>
          {[0, 1, 2, 3].map((value) => (
            <StarRating key={value} value={value as 0 | 1 | 2 | 3} />
          ))}
        </Stack>
        <Stack direction="row" gap={3} wrap>
          <ProgressRing value={0} label="No charge" />
          <ProgressRing value={0.45} tone="cyan" label="Charging" />
          <ProgressRing value={0.7} tone="success" label="Success" />
          <ProgressRing value={0.85} tone="warning" label="Warning" />
          <ProgressRing value={1} tone="danger" label="Full danger" />
        </Stack>
        <Stack direction="row" gap={3} wrap>
          <Kbd>Tab</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>Esc</Kbd>
          <Tooltip label="Opens above"><Button size="sm" variant="secondary">Hover me</Button></Tooltip>
          <Tooltip label="Opens below" side="bottom"><Button size="sm" variant="secondary">Hover me</Button></Tooltip>
        </Stack>
      </Section>

      <InteractiveShowcase />
    </div>
  );
}
