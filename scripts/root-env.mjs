/**
 * Load repo-root `.env`, then optional `local.env` (gitignored) with override.
 * Used for native dev and for passing Build args / compose interpolation when matching Docker is used.
 */
import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

/**
 * @param {string} root - absolute path to repo root
 */
export function loadRootEnv(root) {
  dotenv.config({ path: path.join(root, ".env") });
  const localPath = path.join(root, "local.env");
  if (fs.existsSync(localPath)) {
    dotenv.config({ path: localPath, override: true });
    console.log("[env] local.env loaded (overrides .env)");
  }
}
