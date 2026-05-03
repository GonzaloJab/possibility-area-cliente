/**
 * Runs `docker compose …` with --env-file for repo-root `.env` and optional `local.env`.
 * Env files must appear right after `compose` (not after `docker`).
 *
 * Usage: node scripts/docker-with-env.mjs compose up --build
 *        node scripts/docker-with-env.mjs compose -f docker-compose.yml -f docker-compose.postgres.yml up --build
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rest = process.argv.slice(2);
if (rest.length === 0 || rest[0] !== "compose") {
  console.error("Usage: node scripts/docker-with-env.mjs compose …");
  process.exit(1);
}

const afterCompose = rest.slice(1);

const envInject = [];
const envPath = path.join(root, ".env");
const localPath = path.join(root, "local.env");
if (fs.existsSync(envPath)) {
  envInject.push("--env-file", envPath);
}
if (fs.existsSync(localPath)) {
  envInject.push("--env-file", localPath);
}

const argv = ["compose", ...envInject, ...afterCompose];

const code =
  spawnSync("docker", argv, {
    cwd: root,
    stdio: "inherit",
  }).status ?? 1;
process.exit(code);
