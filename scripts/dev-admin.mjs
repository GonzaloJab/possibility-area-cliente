/**
 * Loads repo-root .env + local.env, then starts Vite (apps/admin).
 * Same env rules as dev-web.mjs so both UIs share API / CORS overrides.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRootEnv } from "./root-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadRootEnv(root);

const viteApi = process.env.VITE_API_URL?.trim();
if (viteApi === "http://localhost:4000" || viteApi === "http://localhost:4000/") {
  delete process.env.VITE_API_URL;
}

const child = spawn("npm", ["-w", "apps/admin", "run", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
