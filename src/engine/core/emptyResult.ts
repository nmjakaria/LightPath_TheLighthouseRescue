/* Shared empty solver result so GameState can reset without carrying a local factory definition. */
import type { OpticsResult } from "@/types/optics";

export function emptyResult(): OpticsResult {
  return {
    segments: [],
    events: [],
    stats: { segmentCount: 0, maxBounce: 0, terminated: {}, solveMs: 0 },
  };
}
