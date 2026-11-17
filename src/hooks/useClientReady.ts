"use client";

/* Route gating must wait until persisted progress is available. Both values use the same
 * useSyncExternalStore mechanism, so when this flips true the store snapshot is current too. */
import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}
function clientSnapshot(): boolean {
  return true;
}
function serverSnapshot(): boolean {
  return false;
}

export function useClientReady(): boolean {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
