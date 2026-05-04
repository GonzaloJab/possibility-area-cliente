/**
 * Loads repo-root .env, then runs (from apps/api): alembic upgrade → seed → uvicorn --reload.
 * Used by npm run dev:stack for a single command local dev against Neon or local Postgres.
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRootEnv } from "./root-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "apps", "api");

loadRootEnv(root);

const env = { ...process.env };

/**
 * Prefer explicit PYTHON, then apps/api/.venv, so Windows Store / global Python
 * (without deps) does not break `python -m alembic`.
 */
function resolvePython() {
  const fromEnv = process.env.PYTHON?.trim();
  if (fromEnv) return fromEnv;

  const winVenv = path.join(apiDir, ".venv", "Scripts", "python.exe");
  const unixVenv = path.join(apiDir, ".venv", "bin", "python");
  if (fs.existsSync(winVenv)) return winVenv;
  if (fs.existsSync(unixVenv)) return unixVenv;

  return process.platform === "win32" ? "python" : "python3";
}

const py = resolvePython();

function ensureApiDeps() {
  const r = spawnSync(py, ["-c", "import alembic, uvicorn"], {
    cwd: apiDir,
    env,
    shell: false,
    encoding: "utf8",
  });
  if ((r.status ?? 1) === 0) return;

  const winHint =
    "cd apps\\api\r\n" +
    "python -m venv .venv\r\n" +
    ".venv\\Scripts\\pip install -r requirements.txt";
  const unixHint =
    "cd apps/api && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt";

  console.error(
    "\n[api] Python:", py,
    "\n[api] Missing API dependencies (alembic / uvicorn). Create a venv under apps/api and install requirements:\n\n",
    process.platform === "win32" ? winHint : unixHint,
    "\n\nOr set PYTHON in .env / local.env to your interpreter that has apps/api/requirements.txt installed.\n",
  );
  process.exit(1);
}

ensureApiDeps();
console.log("[api] Using Python:", py);

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
