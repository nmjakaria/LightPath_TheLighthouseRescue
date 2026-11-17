"use client";

/* Destructive settings actions live behind one confirmation dialog so an accidental click cannot
 * erase a campaign. Both stores validate their own defaults, so no extra sanitising is needed. */
import { useState } from "react";
import { Button, Modal, Panel, useToast } from "@/components/ui";
import { useProgress } from "@/hooks/useProgress";
import { useSettings } from "@/hooks/useSettings";

type PendingAction = "settings" | "progress" | null;

const CONFIRM_TEXT: Record<Exclude<PendingAction, null>, { title: string; body: string; confirm: string }> = {
  settings: {
    title: "Reset settings?",
    body: "Every preference returns to its default. Progress is not affected.",
    confirm: "Reset settings",
  },
  progress: {
    title: "Reset progress?",
    body: "All stars, best times and unlocked levels will be erased. This cannot be undone.",
    confirm: "Erase progress",
  },
};

export function SettingsDataActions() {
  const { resetSettings } = useSettings();
  const { resetProgress } = useProgress();
  const { showToast } = useToast();
  const [pending, setPending] = useState<PendingAction>(null);

  function confirm(): void {
    if (pending === "settings") {
      resetSettings();
      showToast("Settings restored to defaults", "success");
    } else if (pending === "progress") {
      resetProgress();
      showToast("Progress erased", "success");
    }
    setPending(null);
  }

  return (
    <Panel title="Data" eyebrow="Danger zone">
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setPending("settings")}>
          Reset settings
        </Button>
        <Button variant="danger" onClick={() => setPending("progress")}>
          Reset progress
        </Button>
      </div>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending ? CONFIRM_TEXT[pending].title : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirm}>
              {pending ? CONFIRM_TEXT[pending].confirm : "Confirm"}
            </Button>
          </>
        }
      >
        <p className="text-mist">{pending ? CONFIRM_TEXT[pending].body : ""}</p>
      </Modal>
    </Panel>
  );
}
