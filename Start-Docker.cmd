@echo off
REM Docker Compose: API + Web, DB from repo-root `.env` (use your Neon URLs here).
REM On first boot the API runs Alembic + seed → tables + Felipe if missing.
REM For local Postgres in Docker instead: use Start-Docker-Postgres.cmd

cd /d "%~dp0"
where docker >nul 2>&1 || (
  echo docker not found. Install Docker Desktop and try again.
  pause
  exit /b 1
)
if not exist ".env" (
  echo Missing .env — copy .env.example to .env and set DATABASE_URL + DATABASE_URL_ASYNC ^(Neon^).
  pause
  exit /b 1
)
echo [Docker + .env ^(+ local.env if present^)] API http://localhost:4000  Client http://localhost:5173  Admin http://localhost:5174/login
call npm run docker:up
if errorlevel 1 pause
