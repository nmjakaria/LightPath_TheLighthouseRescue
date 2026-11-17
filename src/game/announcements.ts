/*
 * Screen-reader announcements derived from the low-rate HUD snapshot (PRD NFR-017). The text only
 * changes when a meaningful event changes, so the 10 Hz timer never spams assistive technology.
 */
import { formatTime } from "@/lib/formatTime";
import type { HudSnapshot } from "@/engine/core/GameState";

type AnnouncementSnapshot = Pick<
  HudSnapshot,
  | "status"
  | "paused"
  | "feedback"
  | "litTargets"
  | "requiredTargets"
  | "litSwitches"
  | "openGates"
  | "selectedId"
  | "moves"
  | "timeSec"
>;

export function announcementFrom(snapshot: AnnouncementSnapshot): string {
  if (snapshot.status === "complete") {
    return `Level complete in ${formatTime(snapshot.timeSec)} with ${snapshot.moves} moves.`;
  }
  if (snapshot.paused) return "Game paused.";
  if (snapshot.feedback === "locked") return "That component is locked.";
  if (snapshot.feedback === "outsideRange") return "The rock stays within its rail.";

  const parts = [`Target ${snapshot.litTargets} of ${snapshot.requiredTargets} lit`];
  if (snapshot.litSwitches > 0) parts.push(`${snapshot.litSwitches} switch powered`);
  if (snapshot.openGates > 0) parts.push(`${snapshot.openGates} gate open`);
  if (snapshot.selectedId) parts.push(`Selected ${snapshot.selectedId}`);
  return `${parts.join(". ")}.`;
}
