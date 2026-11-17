/*
 * Developer feature flags come from NEXT_PUBLIC_* variables and always have safe defaults.
 * Static process.env.NEXT_PUBLIC_* references are used so Next.js can inline them at build time.
 */
function enabled(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export const features = {
  devUiPage: enabled(process.env.NEXT_PUBLIC_DEV_UI_PAGE, false),
  inspectorEnabled: enabled(process.env.NEXT_PUBLIC_INSPECTOR_ENABLED, true),
  demoUnlockAvailable: enabled(process.env.NEXT_PUBLIC_DEMO_UNLOCK_AVAILABLE, false),
  fpsOverlay: enabled(process.env.NEXT_PUBLIC_FPS_OVERLAY, false),
} as const;

export type FeatureFlags = typeof features;
