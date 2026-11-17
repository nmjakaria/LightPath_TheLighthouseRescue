import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  Button,
  Card,
  IconButton,
  Kbd,
  Modal,
  Panel,
  ProgressRing,
  Section,
  Select,
  Slider,
  Stack,
  StarRating,
  Toast,
  Toggle,
  Tooltip,
} from "@/components/ui";

function render(node: ReactNode): string {
  return renderToStaticMarkup(node);
}

describe("UI primitive accessibility markup", () => {
  it("renders buttons with native semantics, busy state and accessible icon labels", () => {
    const button = render(<Button>Play</Button>);
    expect(button).toContain('<button');
    expect(button).toContain('type="button"');
    expect(button).toContain("Play");
    expect(render(<Button loading>Loading</Button>)).toContain('aria-busy="true"');
    expect(render(<Button disabled>Disabled</Button>)).toContain("disabled=");
    expect(render(<IconButton label="Settings" icon={<span />} />)).toContain('aria-label="Settings"');
  });

  it("uses the switch role for toggles and native inputs for sliders and selects", () => {
    expect(render(<Toggle label="Sound" checked onCheckedChange={() => {}} />)).toContain('role="switch" aria-checked="true"');
    expect(render(<Slider label="Volume" value={50} onChange={() => {}} />)).toContain('type="range"');
    expect(render(<Select label="Quality" options={[{ value: "low", label: "Low" }]} />)).toContain('<option value="low">Low</option>');
  });

  it("labels read-only status indicators", () => {
    expect(render(<StarRating value={2} />)).toContain('aria-label="2 of 3 stars"');
    expect(render(<ProgressRing value={0.45} label="Charging" />)).toContain('aria-label="Charging"');
    expect(render(<Toast message="Beam aligned" />)).toContain('role="status" aria-live="polite"');
  });

  it("keeps the modal out of the tree until opened and marks it as a dialog", () => {
    const onClose = () => {};
    expect(render(<Modal open={false} onClose={onClose} title="Paused">Body</Modal>)).toBe("");
    const opened = render(<Modal open onClose={onClose} title="Paused">Body</Modal>);
    expect(opened).toContain('role="dialog"');
    expect(opened).toContain('aria-modal="true"');
    expect(opened).toContain("Paused");
  });

  it("connects tooltips to their triggers with aria-describedby", () => {
    const html = render(
      <Tooltip label="Rotate">
        <Button>Hint</Button>
      </Tooltip>,
    );
    const describedBy = html.match(/aria-describedby="([^"]+)"/)?.[1];
    expect(describedBy).toBeTruthy();
    expect(html).toContain('id="' + describedBy + '"');
    expect(html).toContain('role="tooltip"');
  });

  it("renders layout and container primitives in DOM order", () => {
    const html = render(
      <Stack direction="row" gap={2}>
        <Card title="Card">Body</Card>
        <Panel eyebrow="HUD" title="Panel">Content</Panel>
        <Section title="Section"><Kbd>Tab</Kbd></Section>
      </Stack>,
    );
    expect(html.indexOf("Card")).toBeLessThan(html.indexOf("Panel"));
    expect(html.indexOf("Panel")).toBeLessThan(html.indexOf("Section"));
    expect(html).toContain("<section");
    expect(html).toContain("<kbd");
  });
});
