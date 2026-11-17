// The showcase is never part of a production build, even if the developer flag is set.
export function isShowcaseEnabled(flag: boolean, nodeEnv: string | undefined): boolean {
  return flag && nodeEnv !== "production";
}
