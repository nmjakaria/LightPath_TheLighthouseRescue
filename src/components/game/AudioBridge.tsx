"use client";

/* Invisible app-root component: installs the audio unlock and settings bridge for every screen. */
import { useAudioBridge } from "@/hooks/useAudio";

export function AudioBridge(): null {
  useAudioBridge();
  return null;
}
