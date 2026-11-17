/* Behavioural numbers for UI primitives. Visual values live in styles/tokens.css and are exposed
 * as Tailwind utilities; nothing here duplicates a palette hex or a gameplay constant. */
export const uiConfig = {
  toast: {
    durationMs: 6000,
    maxVisible: 3,
  },
  progressRing: {
    size: 72,
    strokeWidth: 6,
  },
  starRating: {
    max: 3,
  },
} as const;
