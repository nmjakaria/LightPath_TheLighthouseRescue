/*
 * The settings screen, defaults, validation and persistence all read this ordered schema.
 * A definition owns its own range or options, so adding a setting is a one-file change;
 * GameSettings is derived from the definition union so a key cannot drift between layers.
 */
import type { QualityPreset } from "./gameConfig";

export const SETTING_GROUPS = [
  "Audio",
  "Graphics",
  "Gameplay",
  "Accessibility",
  "Developer / Demo",
] as const;
export type SettingGroup = (typeof SETTING_GROUPS)[number];

export type QualitySetting = "auto" | QualityPreset;
export type RotationStep = 5 | 15;
export type ReducedMotion = "system" | "on" | "off";

interface DefinitionBase<K extends string, V> {
  key: K;
  label: string;
  description: string;
  group: SettingGroup;
  default: V;
}
type SliderDefinition<K extends string> = DefinitionBase<K, number> & {
  type: "slider";
  min: number;
  max: number;
  step: number;
};
type ToggleDefinition<K extends string> = DefinitionBase<K, boolean> & { type: "toggle" };
type SelectDefinition<K extends string, V> = DefinitionBase<K, V> & {
  type: "select";
  options: readonly V[];
};

export type SettingDefinition =
  | SliderDefinition<"masterVolume">
  | SliderDefinition<"sfxVolume">
  | SliderDefinition<"ambientVolume">
  | ToggleDefinition<"muted">
  | ToggleDefinition<"showFps">
  | ToggleDefinition<"colorblindAid">
  | ToggleDefinition<"demoUnlockAll">
  | SelectDefinition<"quality", QualitySetting>
  | SelectDefinition<"rotationStepDeg", RotationStep>
  | SelectDefinition<"reducedMotion", ReducedMotion>;

export type SettingKey = SettingDefinition["key"];
export type GameSettings = { schemaVersion: 1 } & {
  [K in SettingKey]: Extract<SettingDefinition, { key: K }>["default"];
};

export const SETTINGS_SCHEMA = [
  {
    key: "masterVolume",
    type: "slider",
    group: "Audio",
    label: "Master volume",
    description: "Overall loudness of all game audio.",
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.8,
  },
  {
    key: "sfxVolume",
    type: "slider",
    group: "Audio",
    label: "Effects volume",
    description: "Loudness of rotation ticks, chimes and other effects.",
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.9,
  },
  {
    key: "ambientVolume",
    type: "slider",
    group: "Audio",
    label: "Ambience volume",
    description: "Loudness of the ocean ambience.",
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.5,
  },
  {
    key: "muted",
    type: "toggle",
    group: "Audio",
    label: "Mute all audio",
    description: "Silences every sound immediately.",
    default: false,
  },
  {
    key: "quality",
    type: "select",
    group: "Graphics",
    label: "Graphics quality",
    description: "Auto chooses a preset from the device; others are fixed.",
    options: ["auto", "low", "medium", "high"],
    default: "auto",
  },
  {
    key: "showFps",
    type: "toggle",
    group: "Graphics",
    label: "Show FPS",
    description: "Displays the frame-time readout during play.",
    default: false,
  },
  {
    key: "rotationStepDeg",
    type: "select",
    group: "Gameplay",
    label: "Rotation step",
    description: "Angle step used when rotating mirrors and lamps.",
    options: [5, 15],
    default: 15,
  },
  {
    key: "reducedMotion",
    type: "select",
    group: "Accessibility",
    label: "Reduced motion",
    description: "Follows the system setting, or forces calmer animation on or off.",
    options: ["system", "on", "off"],
    default: "system",
  },
  {
    key: "colorblindAid",
    type: "toggle",
    group: "Accessibility",
    label: "Shape cues on targets",
    description: "Adds triangle, circle and square shapes beside target colors.",
    default: false,
  },
  {
    key: "demoUnlockAll",
    type: "toggle",
    group: "Developer / Demo",
    label: "Unlock all levels",
    description: "Demo-only setting; shown only when the feature flag allows it.",
    default: false,
  },
] satisfies readonly SettingDefinition[];

export const DEFAULT_SETTINGS: GameSettings = {
  schemaVersion: 1,
  ...(Object.fromEntries(SETTINGS_SCHEMA.map((definition) => [definition.key, definition.default])) as Omit<
    GameSettings,
    "schemaVersion"
  >),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Repairs any saved value: invalid numbers are defaulted, then clamped to the schema range. */
export function parseSettings(raw: unknown): GameSettings {
  const input = isRecord(raw) ? raw : {};
  const result: Record<string, unknown> = { schemaVersion: 1 };

  for (const definition of SETTINGS_SCHEMA) {
    const value = input[definition.key];
    switch (definition.type) {
      case "slider": {
        const numeric = typeof value === "number" && Number.isFinite(value) ? value : definition.default;
        result[definition.key] = Math.min(definition.max, Math.max(definition.min, numeric));
        break;
      }
      case "toggle":
        result[definition.key] = typeof value === "boolean" ? value : definition.default;
        break;
      case "select":
        result[definition.key] = (definition.options as readonly unknown[]).includes(value)
          ? value
          : definition.default;
        break;
    }
  }
  return result as unknown as GameSettings;
}

/**
 * Assumption: pre-release v0 saves used volume 0..100, step and quality under different names.
 * Any missing or unrecognised field falls back to the current default.
 */
export function migrateSettingsV0(raw: unknown): unknown {
  if (!isRecord(raw)) return DEFAULT_SETTINGS;
  const legacyVolume =
    typeof raw.volume === "number" && Number.isFinite(raw.volume)
      ? Math.min(1, Math.max(0, raw.volume / 100))
      : DEFAULT_SETTINGS.masterVolume;

  return parseSettings({
    masterVolume: legacyVolume,
    sfxVolume: legacyVolume,
    ambientVolume: legacyVolume,
    muted: raw.muted === true,
    quality: DEFAULT_SETTINGS.quality,
    showFps: raw.showFps === true,
    rotationStepDeg: raw.step === 5 ? 5 : 15,
    reducedMotion: raw.reducedMotion === "on" || raw.reducedMotion === "off" ? raw.reducedMotion : "system",
    colorblindAid: raw.colorblindAid === true,
    demoUnlockAll: raw.demoUnlockAll === true,
  });
}
