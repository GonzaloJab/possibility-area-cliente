@echo off
REM Same stack but adds a Postgres container inside Docker — no Neon needed.
REM docker-compose.postgres.yml overrides DATABASE_* to postgres:5432.

cd /d "%~dp0"
where docker >nul 2>&1 || (
  echo docker not found. Install Docker Desktop and try again.
  pause
  exit /b 1
)
echo [Docker + local Postgres container] http://localhost:4000  http://localhost:5173
call npm run docker:up:postgres
if errorlevel 1 pause
