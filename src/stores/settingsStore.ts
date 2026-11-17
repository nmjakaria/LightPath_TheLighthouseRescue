/*
 * The single settings store used by the app. It persists through createPersistentStore, so no
 * component reads LocalStorage directly. The settings screen is generated from the same schema
 * that validates these values (AGENTS §5.3).
 */
import {
  DEFAULT_SETTINGS,
  migrateSettingsV0,
  parseSettings,
  type GameSettings,
  type SettingKey,
} from "@/config/settingsSchema";
import { gameConfig, SCHEMA_VERSIONS, STORAGE_KEYS } from "@/config/gameConfig";
import { createPersistentStore } from "@/lib/store/createPersistentStore";

export const settingsStore = createPersistentStore<GameSettings>({
  key: STORAGE_KEYS.settings,
  schemaVersion: SCHEMA_VERSIONS.settings,
  defaults: DEFAULT_SETTINGS,
  validate: parseSettings,
  migrate: (raw) => migrateSettingsV0(raw),
  debounceMs: gameConfig.storage.writeDebounceMs,
});

/** Updates one schema key while preserving the rest of the saved object. */
export function setSetting<K extends SettingKey>(key: K, value: GameSettings[K]): void {
  settingsStore.set((previous) => ({ ...previous, [key]: value }));
}

/** Server snapshot constant: avoids hydration mismatches before LocalStorage is read on the client. */
export const SERVER_SETTINGS: GameSettings = DEFAULT_SETTINGS;
