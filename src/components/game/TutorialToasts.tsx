"use client";

/* Non-blocking contextual teaching from PRD FR-052. The engine says which tutorials are currently
 * relevant; the save decides which have been seen, and the Toast primitive supplies the dismiss
 * button so each message appears at most once per save. */
import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui";
import type { LevelTutorial } from "@/types/level";

export interface TutorialToastsProps {
  levelId: string;
  tutorials: readonly LevelTutorial[];
  seen: Record<string, boolean>;
  onSeen(id: string): void;
}

export function TutorialToasts({ levelId, tutorials, seen, onSeen }: TutorialToastsProps) {
  const { showToast } = useToast();
  const shown = useRef(new Set<string>());

  useEffect(() => {
    shown.current.clear();
  }, [levelId]);

  useEffect(() => {
    for (const tutorial of tutorials) {
      if (seen[tutorial.id] === true || shown.current.has(tutorial.id)) continue;
      shown.current.add(tutorial.id);
      showToast(tutorial.text, "info");
      onSeen(tutorial.id);
    }
  }, [tutorials, seen, showToast, onSeen]);

  return null;
}
