import { describe, expect, it, vi } from "vitest";
import { createStore } from "@/lib/store/createStore";
import { createPersistentStore, type StorageLike } from "@/lib/store/createPersistentStore";

interface TestValue {
  schemaVersion: 1;
  count: number;
}

function memoryStorage(seed: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(seed));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function blockingStorage(): StorageLike {
  return {
    getItem: () => {
      throw new Error("storage blocked");
    },
    setItem: () => {
      throw new Error("storage blocked");
    },
    removeItem: () => {
      throw new Error("storage blocked");
    },
  };
}

function validate(raw: unknown): TestValue {
  const input = raw as Record<string, unknown> | null;
  return {
    schemaVersion: 1,
    count: typeof input?.count === "number" && Number.isFinite(input.count) ? input.count : 0,
  };
}

function baseOptions() {
  return {
    key: "lightpath.test",
    schemaVersion: 1,
    defaults: { schemaVersion: 1 as const, count: 0 },
    validate,
    debounceMs: 0,
  };
}

describe("createStore", () => {
  it("exposes snapshots, notifies subscribers and supports functional updates", () => {
    const store = createStore(1);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.set((previous) => previous + 2);
    expect(store.getSnapshot()).toBe(3);
    expect(listener).toHaveBeenCalledTimes(1);

    store.set(3);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.set(4);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("createPersistentStore", () => {
  it("starts from defaults when the key is absent and stays persistent", () => {
    const storage = memoryStorage();
    const store = createPersistentStore({ ...baseOptions(), storage });
    expect(store.getSnapshot()).toEqual({ schemaVersion: 1, count: 0 });
    expect(store.isPersistent()).toBe(true);
  });

  it("falls back to defaults for corrupt JSON and future versions", () => {
    const corrupt = createPersistentStore({
      ...baseOptions(),
      storage: memoryStorage({ "lightpath.test": "{not json" }),
    });
    expect(corrupt.getSnapshot().count).toBe(0);
    corrupt.flush();
    expect(corrupt.isPersistent()).toBe(true);

    const future = createPersistentStore({
      ...baseOptions(),
      storage: memoryStorage({ "lightpath.test": JSON.stringify({ schemaVersion: 99, count: 7 }) }),
    });
    expect(future.getSnapshot().count).toBe(0);
  });

  it("migrates a v0 object before validating it", () => {
    const store = createPersistentStore({
      ...baseOptions(),
      storage: memoryStorage({ "lightpath.test": JSON.stringify({ schemaVersion: 0, count: 5 }) }),
      migrate: (raw) => ({ count: Number(raw.count) * 2 }),
    });
    expect(store.getSnapshot().count).toBe(10);
  });

  it("debounces writes but flush persists immediately, and reset clears the key", () => {
    const storage = memoryStorage();
    const store = createPersistentStore({ ...baseOptions(), debounceMs: 10_000, storage });
    store.set({ schemaVersion: 1, count: 3 });
    expect(storage.data.has("lightpath.test")).toBe(false);
    store.flush();
    expect(JSON.parse(storage.data.get("lightpath.test") ?? "{}").count).toBe(3);

    store.reset();
    expect(store.getSnapshot().count).toBe(0);
    expect(storage.data.has("lightpath.test")).toBe(false);
  });

  it("reset clears a pending write and degrades if removal is blocked", () => {
    const storage = memoryStorage();
    const store = createPersistentStore({ ...baseOptions(), debounceMs: 10_000, storage });
    store.set({ schemaVersion: 1, count: 4 });
    store.reset();
    expect(store.getSnapshot().count).toBe(0);
    expect(storage.data.has("lightpath.test")).toBe(false);

    storage.removeItem = () => {
      throw new Error("blocked");
    };
    store.set({ schemaVersion: 1, count: 5 });
    store.flush();
    store.reset();
    expect(store.isPersistent()).toBe(false);
  });

  it("TC-E10: blocked storage switches to in-memory mode instead of crashing", () => {
    const store = createPersistentStore({ ...baseOptions(), storage: blockingStorage() });
    expect(store.isPersistent()).toBe(false);
    store.set({ schemaVersion: 1, count: 9 });
    store.flush();
    expect(store.getSnapshot().count).toBe(9);
  });

  it("TC-E10: a write failure after a successful read also degrades gracefully", () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error("quota exceeded");
    };
    const store = createPersistentStore({ ...baseOptions(), storage });
    expect(store.isPersistent()).toBe(true);
    store.set({ schemaVersion: 1, count: 2 });
    store.flush();
    expect(store.isPersistent()).toBe(false);
    expect(store.getSnapshot().count).toBe(2);
  });

  it("applies cross-tab storage events without echoing them back", () => {
    let handler: ((value: string | null) => void) | undefined;
    const store = createPersistentStore({
      ...baseOptions(),
      storage: memoryStorage(),
      onStorageChange: (nextHandler) => {
        handler = nextHandler;
        return () => {
          handler = undefined;
        };
      },
    });
    handler?.(JSON.stringify({ schemaVersion: 1, count: 7 }));
    expect(store.getSnapshot().count).toBe(7);
    handler?.(null);
    expect(store.getSnapshot().count).toBe(0);
    store.destroy();
    expect(handler).toBeUndefined();
  });
});
