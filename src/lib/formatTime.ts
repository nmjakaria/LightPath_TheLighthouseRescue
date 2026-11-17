/* HUD and menu times are always shown as mm:ss. Missing or corrupt values render as an em dash
 * rather than a misleading zero. */
export function formatTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "—";
  }
  const seconds = Math.floor(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
