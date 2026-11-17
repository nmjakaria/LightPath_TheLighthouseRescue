/*
 * LocalStorage-backed observable store. Every read is validated by the caller's schema, corrupt
 * or future-version data falls back to defaults, blocked storage switches to in-memory mode,
 * writes are debounced, and storage events from other tabs are applied without echoing back.
 */
import { createStore, type Store } from "./createStore";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface PersistentStoreOptions<T> {
  key: string;
  schemaVersion: number;
  defaults: T;
  validate: (raw: unknown) => T;
  migrate?: (raw: Record<string, unknown>, fromVersion: number) => unknown;
  debounceMs: number;
  storage?: StorageLike | null;
  onStorageChange?: (handler: (newValue: string | null) => void) => () => void;
}

export interface PersistentStore<T> extends Store<T> {
  isPersistent(): boolean;
  flush(): void;
  reset(): void;
  destroy(): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function browserStorage(): StorageLike | null {
  try {
    return (globalThis as { localStorage?: StorageLike }).localStorage ?? null;
  } catch {
    return null;
  }
}

function decode<T>(raw: string, options: PersistentStoreOptions<T>): T {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return options.defaults;
    const version = typeof parsed.schemaVersion === "number" ? parsed.schemaVersion : 0;
    if (version > options.schemaVersion) return options.defaults;
    const candidate =
      version < options.schemaVersion && options.migrate ? options.migrate(parsed, version) : parsed;
    return options.validate(candidate);
  } catch {
    return options.defaults;
  }
}

function load<T>(
  options: PersistentStoreOptions<T>,
  storage: StorageLike | null,
): { value: T; persistent: boolean } {
  if (!storage) return { value: options.defaults, persistent: false };
  let raw: string | null;
  try {
    raw = storage.getItem(options.key);
  } catch {
    return { value: options.defaults, persistent: false };
  }
  return raw === null
    ? { value: options.defaults, persistent: true }
    : { value: decode(raw, options), persistent: true };
}

function listenInBrowser(key: string, handler: (newValue: string | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: StorageEvent) => {
    if (event.key === key || event.key === null) handler(event.newValue);
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

export function createPersistentStore<T>(options: PersistentStoreOptions<T>): PersistentStore<T> {
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const initial = load(options, storage);
  const store = createStore(initial.value);
  let persistent = initial.persistent;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function writeNow(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (!persistent || !storage) return;
    try {
      storage.setItem(options.key, JSON.stringify(store.getSnapshot()));
    } catch {
      persistent = false;
    }
  }

  function scheduleWrite(): void {
    if (!persistent) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(writeNow, options.debounceMs);
  }

  const subscribeStorage =
    options.onStorageChange ??
    ((handler: (newValue: string | null) => void) => listenInBrowser(options.key, handler));
  const unsubscribe = subscribeStorage((newValue) => {
    const next = newValue === null ? options.defaults : decode(newValue, options);
    if (!Object.is(next, store.getSnapshot())) store.set(next);
  });

  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    isPersistent: () => persistent,
    set(next) {
      store.set(next);
      scheduleWrite();
    },
    flush: writeNow,
    reset() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      store.set(options.defaults);
      if (persistent && storage) {
        try {
          storage.removeItem(options.key);
        } catch {
          persistent = false;
        }
      }
    },
    destroy() {
      if (timer !== null) clearTimeout(timer);
      unsubscribe();
    },
  };
}
