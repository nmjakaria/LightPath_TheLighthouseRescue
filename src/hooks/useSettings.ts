"use client";

/* Screens read saved settings here and receive effective settings separately; the engine never
 * touches LocalStorage. Environment uses the useSyncExternalStore server/client snapshot split so
 * hydration is deterministic and the detected client values apply on the first client render. */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { GameSettings, SettingKey } from "@/config/settingsSchema";
import {
  detectEnvironment,
  resolveSettings,
  type EffectiveSettings,
  type SettingsEnvironment,
} from "@/lib/settings/resolveSettings";
import { SERVER_SETTINGS, setSetting, settingsStore } from "@/stores/settingsStore";
import { useStore } from "./useStore";

const INITIAL_ENV: SettingsEnvironment = { prefersReducedMotion: false };
let cachedEnv: SettingsEnvironment | null = null;

function clientEnv(): SettingsEnvironment {
  if (cachedEnv === null) cachedEnv = detectEnvironment();
  return cachedEnv;
}

function serverEnv(): SettingsEnvironment {
  return INITIAL_ENV;
}

function subscribeNoop(): () => void {
  return () => {};
}

const resetSettings = (): void => settingsStore.reset();
const getIsPersistent = (): boolean => settingsStore.isPersistent();

export interface UseSettingsResult {
  settings: GameSettings;
  effective: EffectiveSettings;
  setSetting: <K extends SettingKey>(key: K, value: GameSettings[K]) => void;
  resetSettings: () => void;
  isPersistent: boolean;
}

export function useSettings(): UseSettingsResult {
  const settings = useStore(settingsStore, () => SERVER_SETTINGS);
  const env = useSyncExternalStore(subscribeNoop, clientEnv, serverEnv);
  const effective = useMemo(() => resolveSettings(settings, env), [settings, env]);
  const updateSetting = useCallback(
    <K extends SettingKey>(key: K, value: GameSettings[K]) => setSetting(key, value),
    [],
  );

  return {
    settings,
    effective,
    setSetting: updateSetting,
    resetSettings,
    isPersistent: getIsPersistent(),
  };
}
