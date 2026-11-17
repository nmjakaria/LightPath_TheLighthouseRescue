"use client";

/* Thin React bridge to the tiny observable stores. The optional server snapshot keeps the first
 * hydration render deterministic when a store reads LocalStorage at module load on the client. */
import { useSyncExternalStore } from "react";
import type { Store } from "@/lib/store/createStore";

export function useStore<T>(store: Store<T>, getServerSnapshot?: () => T): T {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot ?? store.getSnapshot,
  );
}
