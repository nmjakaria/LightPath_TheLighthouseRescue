import { describe, expect, it } from "vitest";
import { Pool } from "@/engine/particles/Pool";

describe("Pool<T> free list", () => {
  it("preallocates every slot and reuses the most recently released handle", () => {
    let created = 0;
    const pool = new Pool(3, (index) => {
      created += 1;
      return { index };
    });
    expect(created).toBe(3);
    expect(pool.capacity).toBe(3);
    expect(pool.active).toBe(0);
    expect(pool.available).toBe(3);

    const first = pool.acquire();
    const second = pool.acquire();
    expect(first).not.toBe(second);
    expect(pool.active).toBe(2);
    expect(pool.isLive(first)).toBe(true);

    pool.release(first);
    expect(pool.isLive(first)).toBe(false);
    expect(pool.active).toBe(1);

    const reused = pool.acquire();
    expect(reused).toBe(first);
    expect(created).toBe(3);
  });

  it("returns -1 when exhausted and ignores invalid or double releases", () => {
    const pool = new Pool(1, (index) => index);
    expect(pool.acquire()).toBe(0);
    expect(pool.acquire()).toBe(-1);
    pool.release(-1);
    pool.release(9);
    pool.release(0);
    pool.release(0);
    expect(pool.active).toBe(0);
    expect(pool.available).toBe(1);
    expect(pool.isLive(0)).toBe(false);
  });

  it("clear() resets all slots and forEachActive visits only live values", () => {
    const pool = new Pool(3, (index) => ({ index }));
    pool.acquire();
    pool.acquire();
    const seen: number[] = [];
    pool.forEachActive((value) => seen.push(value.index));
    expect(seen).toHaveLength(2);

    pool.clear();
    expect(pool.active).toBe(0);
    expect(pool.available).toBe(3);
    const after: number[] = [];
    pool.forEachActive((value) => after.push(value.index));
    expect(after).toHaveLength(0);
  });

  it("treats non-finite and negative capacities as empty", () => {
    expect(new Pool(Number.NaN, (index) => index).capacity).toBe(0);
    expect(new Pool(-4, (index) => index).acquire()).toBe(-1);
  });
});
