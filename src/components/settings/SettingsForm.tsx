"use client";

/* Settings screen is generated entirely from SETTING_GROUPS + SETTINGS_SCHEMA. Adding a setting
 * needs no edit here; only new control types would require a matching branch in SettingRow. */
import { features } from "@/config/features";
import {
  SETTINGS_SCHEMA,
  SETTING_GROUPS,
  type GameSettings,
  type SettingKey,
} from "@/config/settingsSchema";
import { Panel } from "@/components/ui";
import { useSettings } from "@/hooks/useSettings";
import { SettingsDataActions } from "./SettingsDataActions";
import { SettingRow } from "./SettingRow";

type SettingValue = GameSettings[SettingKey];

export function SettingsForm() {
  const { settings, setSetting, isPersistent } = useSettings();

  function update(key: SettingKey, value: SettingValue): void {
    setSetting(key as never, value as never);
  }

  const groups = SETTING_GROUPS.filter(
    (group) => group !== "Developer / Demo" || features.demoUnlockAvailable,
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-cyan-beam">Preferences</p>
        <h1 className="font-display text-4xl font-semibold text-beam-core">Settings</h1>
        <p className="mt-2 text-sm text-mist">
          {isPersistent ? "Changes save automatically." : "Storage is unavailable; changes last for this session only."}
        </p>
      </header>

      {groups.map((group) => {
        const definitions = SETTINGS_SCHEMA.filter((definition) => definition.group === group);
        if (definitions.length === 0) return null;
        return (
          <Panel key={group} title={group} eyebrow="Configure">
            <div className="divide-y divide-navy-line">
              {definitions.map((definition) => (
                <SettingRow
                  key={definition.key}
                  definition={definition}
                  value={settings[definition.key]}
                  onChange={update}
                />
              ))}
            </div>
          </Panel>
        );
      })}

      <SettingsDataActions />
    </div>
  );
}
