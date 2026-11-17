/* Lightweight level metadata for menus and route gating. Full geometry and solutions arrive with
 * the level data in STEP 10; this file only mirrors the names and objectives in PRD §13. */
export type LevelPreviewKind = "mirrors" | "obstacle" | "prism" | "gate" | "finale";

export interface LevelSummary {
  index: number;
  id: string;
  name: string;
  objective: string;
  preview: LevelPreviewKind;
}

export const LEVEL_CATALOG: readonly LevelSummary[] = [
  {
    index: 1,
    id: "level-01",
    name: "First Light",
    objective: "Aim the lamp at the first boat using two mirrors.",
    preview: "mirrors",
  },
  {
    index: 2,
    id: "level-02",
    name: "The Broken Path",
    objective: "A collapsed wall blocks the straight route. Go around it.",
    preview: "obstacle",
  },
  {
    index: 3,
    id: "level-03",
    name: "Color of Hope",
    objective: "Split the beam and give each boat its own color.",
    preview: "prism",
  },
  {
    index: 4,
    id: "level-04",
    name: "The Dark Passage",
    objective: "Power the switch with one lamp to open the gate for another.",
    preview: "gate",
  },
  {
    index: 5,
    id: "level-05",
    name: "Lighthouse Rescue",
    objective: "Split, switch and slide everything to relight the great lamp.",
    preview: "finale",
  },
] as const;

export function levelById(id: string): LevelSummary | undefined {
  return LEVEL_CATALOG.find((level) => level.id === id);
}
