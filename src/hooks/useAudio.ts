"use client";

/* React bridge for the singleton audio manager. The bridge hook installs the first-gesture unlock
 * and a delegated UI-click cue once at the app root; screens and the game hook use useAudio() to
 * reach the manager without importing the engine directly. */
import { useEffect } from "react";
import { audioManager } from "@/engine/audio/instance";
import { SERVER_SETTINGS, settingsStore } from "@/stores/settingsStore";
import { useStore } from "./useStore";

const GESTURE_OPTIONS = { capture: true, passive: true } as const;

export function useAudio() {
  return audioManager;
}

export function useAudioBridge(): void {
  const settings = useStore(settingsStore, () => SERVER_SETTINGS);

  useEffect(() => {
    audioManager.setSettings({
      masterVolume: settings.masterVolume,
      sfxVolume: settings.sfxVolume,
      ambientVolume: settings.ambientVolume,
      muted: settings.muted,
    });
  }, [settings]);

  useEffect(() => {
    const unlock = (): void => audioManager.unlock();
    const onClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("button, [role='button'], a");
      if (control && !(control as HTMLButtonElement).disabled) audioManager.play("uiClick");
    };
    window.addEventListener("pointerdown", unlock, GESTURE_OPTIONS);
    window.addEventListener("keydown", unlock, GESTURE_OPTIONS);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("pointerdown", unlock, GESTURE_OPTIONS);
      window.removeEventListener("keydown", unlock, GESTURE_OPTIONS);
      document.removeEventListener("click", onClick);
    };
  }, []);
}
