/**
 * Loads root .env + local.env into process.env, then starts Vite (apps/web).
 * Ensures VITE_API_URL etc. match local overrides without touching production .env.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRootEnv } from "./root-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadRootEnv(root);

const child = spawn("npm", ["-w", "apps/web", "run", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
