/**
 * Loads repo-root .env, then runs (from apps/api): alembic upgrade → seed → uvicorn --reload.
 * Used by npm run dev:stack for a single command local dev against Neon or local Postgres.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRootEnv } from "./root-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "apps", "api");

loadRootEnv(root);

const py = process.env.PYTHON ?? "python";
const env = { ...process.env };

function run(title, cmd, args) {
  console.log(`\n→ ${title}\n`);
  const r = spawnSync(cmd, args, {
    cwd: apiDir,
    env,
    stdio: "inherit",
    shell: false,
  });
  const code = r.status ?? (r.signal ? 1 : 0);
  if (code !== 0) process.exit(code);
}

run("alembic upgrade head", py, ["-m", "alembic", "upgrade", "head"]);
run("seed (idempotent)", py, ["seed.py"]);
run("uvicorn :4000", py, ["-m", "uvicorn", "app.main:app", "--reload", "--port", "4000"]);
