/* Cross-platform wrapper for the static-export build. Next 16 has no --config flag, so the config
 * selects export mode from LIGHTPATH_STATIC_EXPORT instead of a second config file. */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, LIGHTPATH_STATIC_EXPORT: "1" },
});
process.exit(result.status ?? 1);
