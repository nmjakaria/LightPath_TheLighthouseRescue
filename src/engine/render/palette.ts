/*
 * Canvas cannot resolve `var(--token)` in fillStyle, so the React boundary resolves the design
 * tokens once from getComputedStyle and passes plain strings into the renderer. This keeps the
 * palette defined only in styles/tokens.css.
 */
export const PALETTE_VARIABLES = {
  abyss: "--abyss",
  midnight: "--midnight",
  deepNavy: "--deep-navy",
  navyLine: "--navy-line",
  cyanBeam: "--cyan-beam",
  oceanTeal: "--ocean-teal",
  beamCore: "--beam-core",
  softWhite: "--soft-white",
  mist: "--mist",
  starGold: "--star-gold",
  lightRed: "--light-red",
  lightGreen: "--light-green",
  lightBlue: "--light-blue",
  success: "--success",
  warning: "--warning",
  danger: "--danger",
} as const;

export type PaletteKey = keyof typeof PALETTE_VARIABLES;
export type Palette = Record<PaletteKey, string>;

export function readPalette(style: CSSStyleDeclaration): Palette {
  const result = {} as Palette;
  for (const key of Object.keys(PALETTE_VARIABLES) as PaletteKey[]) {
    result[key] = style.getPropertyValue(PALETTE_VARIABLES[key]).trim();
  }
  return result;
}
