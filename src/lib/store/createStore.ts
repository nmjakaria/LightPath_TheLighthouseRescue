/*
 * Minimal synchronous observable: a value, a setter that replaces or updates it, and listeners.
 * Snapshots are immutable so useSyncExternalStore can compare them by identity in React.
 */
export interface Store<T> {
  getSnapshot(): T;
  set(next: T | ((previous: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => value,
    set(next) {
      const updated = typeof next === "function" ? (next as (previous: T) => T)(value) : next;
      if (Object.is(updated, value)) return;
      value = updated;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
