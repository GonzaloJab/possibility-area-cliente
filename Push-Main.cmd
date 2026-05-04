@echo off
REM Push current branch to origin (e.g. GitHub). Commit in your IDE or `git commit` first.
REM If Render (or similar) is connected to this branch, deploy usually starts automatically.

cd /d "%~dp0"
where git >nul 2>&1 || (
  echo git not found. Install Git and try again.
  pause
  exit /b 1
)

for /f %%i in ('git branch --show-current') do set BRANCH=%%i
echo Pushing branch: %BRANCH%
git push -u origin %BRANCH%
if errorlevel 1 (
  echo Push failed. Fix the error above, then retry.
  pause
  exit /b 1
)
echo Done. Watch your host ^(Render / Actions^) for the deploy run.
pause
