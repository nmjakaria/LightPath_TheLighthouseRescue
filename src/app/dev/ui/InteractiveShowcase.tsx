"use client";

import { useState } from "react";
import {
  Button,
  Modal,
  Section,
  Select,
  Slider,
  Stack,
  StarRating,
  Toggle,
  useToast,
  type StarValue,
} from "@/components/ui";

const qualityOptions = [
  { value: "auto", label: "Auto" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function InteractiveShowcase() {
  const [volume, setVolume] = useState(60);
  const [sound, setSound] = useState(true);
  const [quality, setQuality] = useState("auto");
  const [stars, setStars] = useState<StarValue>(2);
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();

  return (
    <Section title="Interactive controls and feedback" description="Keyboard-operable, with live state.">
      <div className="grid gap-6 md:grid-cols-2">
        <Slider
          label="Master volume"
          value={volume}
          min={0}
          max={100}
          step={5}
          valueLabel={`${volume}%`}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
        <Select label="Quality" value={quality} options={qualityOptions} onChange={(event) => setQuality(event.target.value)} />
        <div className="flex items-center gap-4">
          <Toggle label="Sound enabled" checked={sound} onCheckedChange={setSound} />
          <span className="font-mono text-sm text-mist">{sound ? "on" : "off"}</span>
        </div>
        <div className="flex items-center gap-4">
          <Toggle label="Unavailable option" checked={false} onCheckedChange={() => {}} disabled />
          <span className="text-sm text-mist">disabled</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-mist">Interactive stars</span>
          <StarRating value={stars} onChange={setStars} />
        </div>
      </div>

      <Stack direction="row" gap={2} wrap>
        <Button variant="secondary" size="sm" onClick={() => showToast("Beam aligned", "info")}>
          Info toast
        </Button>
        <Button variant="secondary" size="sm" onClick={() => showToast("Target activated", "success")}>
          Success toast
        </Button>
        <Button variant="secondary" size="sm" onClick={() => showToast("Gate is closing", "warning")}>
          Warning toast
        </Button>
        <Button variant="secondary" size="sm" onClick={() => showToast("Mirror jammed", "danger")}>
          Danger toast
        </Button>
        <Button onClick={() => setModalOpen(true)}>Open modal</Button>
      </Stack>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Paused"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Resume</Button>
          </>
        }
      >
        <p className="text-mist">Tab stays inside this dialog. Escape and the backdrop close it, and focus returns here.</p>
      </Modal>
    </Section>
  );
}
