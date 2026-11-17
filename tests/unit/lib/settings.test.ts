import { afterEach, describe, expect, it, vi } from "vitest";
import { gameConfig, SCHEMA_VERSIONS, STORAGE_KEYS } from "@/config/gameConfig";
import {
  DEFAULT_SETTINGS,
  migrateSettingsV0,
  parseSettings,
  SETTINGS_SCHEMA,
  type SettingDefinition,
} from "@/config/settingsSchema";
import { autoQuality, detectEnvironment, resolveSettings } from "@/lib/settings/resolveSettings";

describe("settings schema", () => {
  it("derives defaults and unique keys from the ordered schema", () => {
    const keys = SETTINGS_SCHEMA.map((definition) => definition.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const definition of SETTINGS_SCHEMA) {
      expect(DEFAULT_SETTINGS[definition.key]).toBe(
        (definition as SettingDefinition).default,
      );
    }
    expect(DEFAULT_SETTINGS.schemaVersion).toBe(1);
    expect(parseSettings(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });

  it("repairs out-of-range numbers, invalid enums and wrong-typed booleans", () => {
    const repaired = parseSettings({
      masterVolume: 5,
      sfxVolume: -3,
      ambientVolume: Number.NaN,
      quality: "ultra",
      rotationStepDeg: 12,
      reducedMotion: "maybe",
      muted: "yes",
      showFps: 1,
      colorblindAid: null,
    });
    expect(repaired.masterVolume).toBe(1);
    expect(repaired.sfxVolume).toBe(0);
    expect(repaired.ambientVolume).toBe(DEFAULT_SETTINGS.ambientVolume);
    expect(repaired.quality).toBe("auto");
    expect(repaired.rotationStepDeg).toBe(15);
    expect(repaired.reducedMotion).toBe("system");
    expect(repaired.muted).toBe(false);
    expect(repaired.showFps).toBe(false);
    expect(repaired.colorblindAid).toBe(false);
  });

  it("falls back entirely when the saved value is not an object", () => {
    expect(parseSettings("nonsense")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("migrates a fake v0 settings object", () => {
    const migrated = migrateSettingsV0({
      volume: 40,
      step: 5,
      muted: true,
      reducedMotion: "on",
      colorblindAid: true,
    }) as typeof DEFAULT_SETTINGS;
    expect(migrated.masterVolume).toBeCloseTo(0.4, 12);
    expect(migrated.sfxVolume).toBeCloseTo(0.4, 12);
    expect(migrated.rotationStepDeg).toBe(5);
    expect(migrated.muted).toBe(true);
    expect(migrated.reducedMotion).toBe("on");
    expect(migrated.colorblindAid).toBe(true);
    expect(migrated.quality).toBe(DEFAULT_SETTINGS.quality);
    expect(parseSettings(migrated)).toEqual(migrated);
  });
});

describe("environment detection", () => {
  const globalWithWindow = globalThis as { window?: unknown };
  const originalWindow = globalWithWindow.window;

  afterEach(() => {
    globalWithWindow.window = originalWindow;
  });

  it("returns a safe default when there is no window (SSR)", () => {
    globalWithWindow.window = undefined;
    expect(detectEnvironment()).toEqual({ prefersReducedMotion: false });
  });

  it("reads matchMedia and navigator when a window exists", () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    globalWithWindow.window = {
      matchMedia,
      navigator: { hardwareConcurrency: 16, deviceMemory: 32 },
    };
    expect(detectEnvironment()).toEqual({
      prefersReducedMotion: true,
      hardwareConcurrency: 16,
      deviceMemory: 32,
    });
    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");

    globalWithWindow.window = { navigator: {} };
    expect(detectEnvironment()).toEqual({
      prefersReducedMotion: false,
      hardwareConcurrency: undefined,
      deviceMemory: undefined,
    });
  });
});

describe("effective settings", () => {
  it("maps auto quality from device capability and resolves system reduced motion", () => {
    expect(autoQuality({ prefersReducedMotion: false, hardwareConcurrency: 2, deviceMemory: 8 })).toBe("low");
    expect(autoQuality({ prefersReducedMotion: false, hardwareConcurrency: 6, deviceMemory: 8 })).toBe("medium");
    expect(autoQuality({ prefersReducedMotion: false, hardwareConcurrency: 12, deviceMemory: 16 })).toBe("high");

    const effective = resolveSettings(DEFAULT_SETTINGS, {
      prefersReducedMotion: true,
      hardwareConcurrency: 2,
      deviceMemory: 2,
    });
    expect(effective.quality).toBe("low");
    expect(effective.reducedMotion).toBe(true);
    expect(effective.qualityPreset).toEqual(gameConfig.quality.low);
    expect(effective.rotationStepDeg).toBe(15);
  });

  it("honours explicit quality and reduced-motion choices", () => {
    const effective = resolveSettings(
      { ...DEFAULT_SETTINGS, quality: "high", reducedMotion: "off" },
      { prefersReducedMotion: true, hardwareConcurrency: 2, deviceMemory: 2 },
    );
    expect(effective.quality).toBe("high");
    expect(effective.reducedMotion).toBe(false);
    expect(effective.qualityPreset).toEqual(gameConfig.quality.high);
  });
});

describe("static config", () => {
  it("uses the PRD constants and storage keys", () => {
    expect(gameConfig.world).toEqual({ width: 1280, height: 720 });
    expect(gameConfig.boundary).toEqual({ x0: 40, y0: 40, x1: 1240, y1: 680 });
    expect(gameConfig.optics.maxBounces).toBe(24);
    expect(gameConfig.optics.minIntensity).toBe(0.05);
    expect(gameConfig.scoring.stars).toEqual({ three: 800, two: 500 });
    expect(STORAGE_KEYS.settings).toBe("lightpath.v1.settings");
    expect(STORAGE_KEYS.progress).toBe("lightpath.v1.progress");
    expect(SCHEMA_VERSIONS).toEqual({ settings: 1, progress: 1 });
  });
});
