"use client";

/* One schema definition becomes one labelled control. The switch below is the only place that
 * knows the difference between slider/toggle/select, so SettingsForm stays data-driven. */
import type { GameSettings, SettingDefinition, SettingKey } from "@/config/settingsSchema";
import { Select, Slider, Toggle, type SelectOption } from "@/components/ui";

type SettingValue = GameSettings[SettingKey];

export interface SettingRowProps {
  definition: SettingDefinition;
  value: SettingValue;
  onChange: (key: SettingKey, value: SettingValue) => void;
}

function optionLabel(option: string | number): string {
  if (typeof option === "number") return `${option}°`;
  return option.charAt(0).toUpperCase() + option.slice(1);
}

export function SettingRow({ definition, value, onChange }: SettingRowProps) {
  const description = (
    <div className="max-w-md">
      <p className="font-display font-semibold text-soft-white">{definition.label}</p>
      <p className="text-sm text-mist">{definition.description}</p>
    </div>
  );

  if (definition.type === "slider") {
    const numeric = typeof value === "number" ? value : definition.default;
    const asPercent = definition.min === 0 && definition.max === 1;
    return (
      <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        {description}
        <div className="w-full sm:max-w-xs">
          <Slider
            label={definition.label}
            value={numeric}
            min={definition.min}
            max={definition.max}
            step={definition.step}
            valueLabel={asPercent ? `${Math.round(numeric * 100)}%` : String(numeric)}
            onChange={(event) => onChange(definition.key, Number(event.target.value))}
          />
        </div>
      </div>
    );
  }

  if (definition.type === "toggle") {
    return (
      <div className="flex items-center justify-between gap-4 py-2">
        {description}
        <Toggle
          label={definition.label}
          checked={typeof value === "boolean" ? value : definition.default}
          onCheckedChange={(checked) => onChange(definition.key, checked)}
        />
      </div>
    );
  }

  const options: readonly SelectOption[] = definition.options.map((option) => ({
    value: String(option),
    label: optionLabel(option),
  }));
  const selected = typeof value === "string" || typeof value === "number" ? String(value) : undefined;
  return (
    <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      {description}
      <div className="w-full sm:max-w-xs">
        <Select
          label={definition.label}
          options={options}
          value={selected}
          onChange={(event) => {
            const match = (definition.options as readonly (string | number)[]).find(
              (option) => String(option) === event.target.value,
            );
            if (match !== undefined) onChange(definition.key, match as SettingValue);
          }}
        />
      </div>
    </div>
  );
}
