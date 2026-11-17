/*
 * Spacing warnings for PRD §13.1. Reference coordinates may still be playtested, so an overlap or
 * a mirror's full rotation sweep touching another solid is reported as a warning, never an error.
 */
import { gameConfig } from "@/config/gameConfig";
import type { Vec2 } from "@/types/vec2";
import { isRecord, point } from "./levelValidatorFields";
import type { IssueList, UnknownRecord } from "./validationTypes";

interface SpreadComponent {
  id: string;
  center: Vec2;
  radius: number;
}

/** Errors already reported by collectFields; a malformed array must never crash the spacing pass. */
function componentsOf(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

export function spreadComponents(level: UnknownRecord, ids: readonly string[]): SpreadComponent[] {
  const result: SpreadComponent[] = [];
  const add = (id: string | null, center: Vec2 | null, radius: number | null): void => {
    if (id && center && radius !== null && Number.isFinite(radius)) {
      result.push({ id, center, radius });
    }
  };

  componentsOf(level.mirrors)?.forEach((mirror: unknown) => {
    if (!isRecord(mirror) || !isRecord(mirror.center)) return;
    add(mirror.id as string | null, point(mirror.center, "", []), (mirror.length as number) / 2);
  });
  componentsOf(level.sources)?.forEach((source: unknown) => {
    if (!isRecord(source) || !isRecord(source.position)) return;
    const radius = (source.housingRadius as number) ?? gameConfig.optics.lampHousingRadius;
    add(source.id as string | null, point(source.position, "", []), radius);
  });
  for (const key of ["targets", "switches", "prisms"] as const) {
    componentsOf(level[key])?.forEach((item: unknown) => {
      if (!isRecord(item) || !isRecord(item.center)) return;
      const radius = key === "prisms" ? (item.circumradius as number) : (item.radius as number);
      add(item.id as string | null, point(item.center, "", []), radius);
    });
  }
  return result.filter((component) => ids.includes(component.id));
}

export function warnSpacing(components: readonly SpreadComponent[], warnings: IssueList): void {
  for (let left = 0; left < components.length; left += 1) {
    for (let right = left + 1; right < components.length; right += 1) {
      const a = components[left];
      const b = components[right];
      const gap =
        Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y) - (a.radius + b.radius);
      if (gap < 0) {
        warnings.push({
          path: `${a.id}/${b.id}`,
          message: "components overlap or their rotation sweeps touch",
        });
      }
    }
  }
}
