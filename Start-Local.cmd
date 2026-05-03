@echo off
REM Native dev: loads .env then optional local.env ^(override localhost CORS / VITE / DB^).
REM Same as: npm run dev    ^| Optional: copy local.env.example to local.env

cd /d "%~dp0"
where npm >nul 2>&1 || (
  echo npm not found. Install Node.js 20+ and try again.
  pause
  exit /b 1
)
echo [Native] API + Web ^| http://localhost:4000  http://localhost:5173 ^| DB from .env at repo root
call npm run dev:stack
if errorlevel 1 pause
