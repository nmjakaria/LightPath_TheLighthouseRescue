// Tiny class-name joiner: falsy values disappear, nested arrays flatten, no external dependency.
export type ClassValue = string | number | false | null | undefined | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const result: string[] = [];
  for (const value of values) {
    if (value === false || value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) result.push(cn(...value));
    else result.push(String(value));
  }
  return result.filter(Boolean).join(" ");
}
